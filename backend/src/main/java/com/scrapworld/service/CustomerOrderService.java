package com.scrapworld.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.scrapworld.dto.ConfirmOrderItemRequest;
import com.scrapworld.dto.ConfirmOrderRequest;
import com.scrapworld.dto.CreateOrderRequest;
import com.scrapworld.dto.CustomerOrderResponse;
import com.scrapworld.dto.OrderItemRequest;
import com.scrapworld.dto.OrderItemResponse;
import com.scrapworld.dto.UpdateOrderStatusRequest;
import com.scrapworld.entity.CustomerOrder;
import com.scrapworld.entity.OrderItem;
import com.scrapworld.entity.OrderStatus;
import com.scrapworld.entity.Payment;
import com.scrapworld.entity.PaymentStatus;
import com.scrapworld.entity.User;
import com.scrapworld.repository.CustomerOrderRepository;
import com.scrapworld.repository.PaymentRepository;
import com.scrapworld.repository.UserRepository;
import com.scrapworld.security.UserPrincipal;

@Service
public class CustomerOrderService {

	private final CustomerOrderRepository orderRepository;
	private final PaymentRepository paymentRepository;
	private final UserRepository userRepository;

	public CustomerOrderService(
			CustomerOrderRepository orderRepository,
			PaymentRepository paymentRepository,
			UserRepository userRepository) {
		this.orderRepository = orderRepository;
		this.paymentRepository = paymentRepository;
		this.userRepository = userRepository;
	}

	@Transactional
	public CustomerOrderResponse create(CreateOrderRequest request, UserPrincipal principal) {
		if (request.preferredDate().isBefore(LocalDate.now())) {
			throw new IllegalArgumentException("Preferred date cannot be in the past");
		}
		User customer = userRepository.findById(principal.id())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer account not found"));
		List<OrderItem> items = request.items().stream().map(this::createItem).toList();
		BigDecimal estimate = items.stream()
				.map(OrderItem::getEstimatedTotal)
				.reduce(BigDecimal.ZERO, BigDecimal::add)
				.setScale(2, RoundingMode.HALF_UP);
		if (estimate.compareTo(new BigDecimal("9999999999.99")) > 0) {
			throw new IllegalArgumentException("Estimated order total exceeds the supported amount");
		}

		CustomerOrder order = new CustomerOrder(
				"SW-" + UUID.randomUUID().toString().toUpperCase(),
				customer,
				estimate,
				customer.getFullName(),
				customer.getEmail(),
				customer.getPhone(),
				request.address().trim(),
				request.city().trim(),
				request.state().trim(),
				request.pincode().trim(),
				request.fulfillmentType(),
				request.fulfillmentAddress().trim(),
				request.preferredDate(),
				request.preferredTime().trim(),
				request.instructions() == null ? "" : request.instructions().trim(),
				request.paymentMethod());
		items.forEach(order::addItem);
		orderRepository.save(order);
		Payment payment = paymentRepository.save(new Payment(order, estimate, PaymentStatus.PENDING, null));
		return toResponse(order, payment);
	}

	@Transactional(readOnly = true)
	public List<CustomerOrderResponse> getCustomerOrders(UserPrincipal principal) {
		return orderRepository.findByCustomer_IdOrderByCreatedAtDesc(principal.id()).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public CustomerOrderResponse getCustomerOrder(String orderNumber, UserPrincipal principal) {
		CustomerOrder order = findOrder(orderNumber);
		if (!order.getCustomer().getId().equals(principal.id())) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
		}
		return toResponse(order);
	}

	@Transactional(readOnly = true)
	public List<CustomerOrderResponse> getAllOrders() {
		return orderRepository.findAllByOrderByCreatedAtDesc().stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public CustomerOrderResponse confirmFinalPrice(String orderNumber, ConfirmOrderRequest request) {
		CustomerOrder order = findOrder(orderNumber);
		Payment payment = paymentRepository.findFirstByOrder_IdOrderByIdDesc(order.getId())
				.orElseThrow(() -> new IllegalStateException("Payment record is missing for order " + orderNumber));
		if (payment.getStatus() == PaymentStatus.PAID) {
			throw new IllegalArgumentException("Final pricing cannot be changed after payment is received");
		}
		Set<Long> updatedItemIds = new HashSet<>();
		BigDecimal calculatedTotal = BigDecimal.ZERO;
		for (ConfirmOrderItemRequest submitted : request.items()) {
			if (!updatedItemIds.add(submitted.id())) {
				throw new IllegalArgumentException("Each order item may only be confirmed once");
			}
			OrderItem item = order.getItems().stream()
					.filter(existing -> existing.getId().equals(submitted.id()))
					.findFirst()
					.orElseThrow(() -> new IllegalArgumentException("Order item does not belong to this order"));
			BigDecimal lineTotal = submitted.finalTotal().setScale(2, RoundingMode.HALF_UP);
			item.confirm(submitted.confirmedWeightKg(), lineTotal);
			calculatedTotal = calculatedTotal.add(lineTotal);
		}
		if (updatedItemIds.size() != order.getItems().size()) {
			throw new IllegalArgumentException("Confirm the final weight and price for every order item");
		}
		BigDecimal finalAmount = request.finalAmount().setScale(2, RoundingMode.HALF_UP);
		if (calculatedTotal.setScale(2, RoundingMode.HALF_UP).compareTo(finalAmount) != 0) {
			throw new IllegalArgumentException("Final amount must equal the total of the confirmed order items");
		}
		order.confirmFinalAmount(finalAmount);
		payment.updateAmount(finalAmount);
		return toResponse(order);
	}

	@Transactional
	public CustomerOrderResponse markPaymentReceived(String orderNumber) {
		CustomerOrder order = findOrder(orderNumber);
		if (order.getFinalAmount() == null) {
			throw new IllegalArgumentException("Confirm the final order amount before recording payment");
		}
		Payment payment = paymentRepository.findFirstByOrder_IdOrderByIdDesc(order.getId())
				.orElseThrow(() -> new IllegalStateException("Payment record is missing for order " + orderNumber));
		if (payment.getStatus() != PaymentStatus.PENDING) {
			throw new IllegalArgumentException("Only pending payments can be marked as received");
		}
		payment.markPaid(Instant.now());
		return toResponse(order, payment);
	}

	@Transactional
	public CustomerOrderResponse updateStatus(String orderNumber, UpdateOrderStatusRequest request) {
		CustomerOrder order = findOrder(orderNumber);
		order.setStatus(request.status());
		return toResponse(order);
	}

	private OrderItem createItem(OrderItemRequest request) {
		BigDecimal price = request.pricePerKg().setScale(2, RoundingMode.HALF_UP);
		BigDecimal quantity = request.quantityKg().setScale(3, RoundingMode.HALF_UP);
		BigDecimal total = price.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
		if (total.compareTo(new BigDecimal("9999999999.99")) > 0) {
			throw new IllegalArgumentException("Product estimate exceeds the supported amount");
		}
		String imageUrl = request.imageUrl();
		if (imageUrl != null && !imageUrl.isBlank()
				&& !imageUrl.startsWith("https://") && !imageUrl.startsWith("http://")) {
			throw new IllegalArgumentException("Product image must use HTTP or HTTPS");
		}
		return new OrderItem(
				request.productKey().trim(),
				request.productName().trim(),
				imageUrl,
				price,
				quantity,
				total);
	}

	private CustomerOrder findOrder(String orderNumber) {
		return orderRepository.findByOrderNumber(orderNumber)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
	}

	private CustomerOrderResponse toResponse(CustomerOrder order) {
		Payment payment = paymentRepository.findFirstByOrder_IdOrderByIdDesc(order.getId()).orElse(null);
		return toResponse(order, payment);
	}

	private CustomerOrderResponse toResponse(CustomerOrder order, Payment payment) {
		List<OrderItemResponse> items = order.getItems().stream()
				.map(item -> new OrderItemResponse(
						item.getId(),
						item.getProductKey(),
						item.getProductName(),
						item.getImageUrl(),
						item.getPricePerKg(),
						item.getQuantityKg(),
						item.getEstimatedTotal(),
						item.getConfirmedWeightKg(),
						item.getFinalTotal()))
				.toList();
		return new CustomerOrderResponse(
				order.getOrderNumber(),
				order.getCreatedAt(),
				order.getCustomerName(),
				order.getCustomerEmail(),
				order.getCustomerPhone(),
				order.getAddress(),
				order.getCity(),
				order.getState(),
				order.getPincode(),
				order.getFulfillmentType(),
				order.getFulfillmentAddress(),
				order.getPreferredDate(),
				order.getPreferredTime(),
				order.getInstructions(),
				order.getStatus().name(),
				order.getTotalAmount(),
				order.getFinalAmount(),
				order.getPaymentMethod(),
				payment == null ? PaymentStatus.PENDING.name() : payment.getStatus().name(),
				items);
	}
}
