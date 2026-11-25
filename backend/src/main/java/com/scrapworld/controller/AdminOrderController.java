package com.scrapworld.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.scrapworld.dto.ConfirmOrderRequest;
import com.scrapworld.dto.CustomerOrderResponse;
import com.scrapworld.dto.UpdateOrderStatusRequest;
import com.scrapworld.service.CustomerOrderService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

	private final CustomerOrderService orderService;

	public AdminOrderController(CustomerOrderService orderService) {
		this.orderService = orderService;
	}

	@GetMapping
	public List<CustomerOrderResponse> getAll() {
		return orderService.getAllOrders();
	}

	@PutMapping("/{orderNumber}/final-price")
	public CustomerOrderResponse confirmFinalPrice(
			@PathVariable String orderNumber,
			@Valid @RequestBody ConfirmOrderRequest request) {
		return orderService.confirmFinalPrice(orderNumber, request);
	}

	@PatchMapping("/{orderNumber}/payment-received")
	public CustomerOrderResponse markPaymentReceived(@PathVariable String orderNumber) {
		return orderService.markPaymentReceived(orderNumber);
	}

	@PatchMapping("/{orderNumber}/status")
	public CustomerOrderResponse updateStatus(
			@PathVariable String orderNumber,
			@Valid @RequestBody UpdateOrderStatusRequest request) {
		return orderService.updateStatus(orderNumber, request);
	}
}
