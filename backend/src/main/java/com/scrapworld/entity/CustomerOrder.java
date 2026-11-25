package com.scrapworld.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "customer_orders", uniqueConstraints = @UniqueConstraint(
		name = "uk_customer_orders_order_number", columnNames = "order_number"))
public class CustomerOrder {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "order_number", nullable = false, length = 50)
	private String orderNumber;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "customer_id", nullable = false)
	private User customer;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private OrderStatus status;

	@Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
	private BigDecimal totalAmount;

	@Column(name = "final_amount", precision = 12, scale = 2)
	private BigDecimal finalAmount;

	@Column(name = "customer_name", nullable = false, length = 100)
	private String customerName;

	@Column(name = "customer_email", nullable = false, length = 150)
	private String customerEmail;

	@Column(name = "customer_phone", nullable = false, length = 15)
	private String customerPhone;

	@Column(name = "address", nullable = false, length = 255)
	private String address;

	@Column(nullable = false, length = 100)
	private String city;

	@Column(nullable = false, length = 100)
	private String state;

	@Column(nullable = false, length = 10)
	private String pincode;

	@Column(name = "fulfillment_type", nullable = false, length = 20)
	private String fulfillmentType;

	@Column(name = "fulfillment_address", nullable = false, length = 255)
	private String fulfillmentAddress;

	@Column(name = "preferred_date", nullable = false)
	private LocalDate preferredDate;

	@Column(name = "preferred_time", nullable = false, length = 50)
	private String preferredTime;

	@Column(length = 1000)
	private String instructions;

	@Column(name = "payment_method", nullable = false, length = 30)
	private String paymentMethod;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<OrderItem> items = new ArrayList<>();

	protected CustomerOrder() {
	}

	public CustomerOrder(String orderNumber, User customer, OrderStatus status, BigDecimal totalAmount) {
		this.orderNumber = orderNumber;
		this.customer = customer;
		this.status = status;
		this.totalAmount = totalAmount;
		this.customerName = customer.getFullName();
		this.customerEmail = customer.getEmail();
		this.customerPhone = customer.getPhone();
		this.address = "Not provided";
		this.city = "Not provided";
		this.state = "Not provided";
		this.pincode = "000000";
		this.fulfillmentType = "PICKUP";
		this.fulfillmentAddress = "Not provided";
		this.preferredDate = LocalDate.now();
		this.preferredTime = "To be arranged";
		this.paymentMethod = "CASH_ON_PICKUP";
	}

	public CustomerOrder(
			String orderNumber,
			User customer,
			BigDecimal totalAmount,
			String customerName,
			String customerEmail,
			String customerPhone,
			String address,
			String city,
			String state,
			String pincode,
			String fulfillmentType,
			String fulfillmentAddress,
			LocalDate preferredDate,
			String preferredTime,
			String instructions,
			String paymentMethod) {
		this.orderNumber = orderNumber;
		this.customer = customer;
		this.status = OrderStatus.PENDING;
		this.totalAmount = totalAmount;
		this.customerName = customerName;
		this.customerEmail = customerEmail;
		this.customerPhone = customerPhone;
		this.address = address;
		this.city = city;
		this.state = state;
		this.pincode = pincode;
		this.fulfillmentType = fulfillmentType;
		this.fulfillmentAddress = fulfillmentAddress;
		this.preferredDate = preferredDate;
		this.preferredTime = preferredTime;
		this.instructions = instructions;
		this.paymentMethod = paymentMethod;
	}

	public void addItem(OrderItem item) {
		items.add(item);
		item.setOrder(this);
	}

	public void confirmFinalAmount(BigDecimal finalAmount) {
		this.finalAmount = finalAmount;
	}

	public void setStatus(OrderStatus status) {
		this.status = status;
	}

	@PrePersist
	void setCreatedAt() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public Long getId() {
		return id;
	}

	public String getOrderNumber() {
		return orderNumber;
	}

	public User getCustomer() {
		return customer;
	}

	public OrderStatus getStatus() {
		return status;
	}

	public BigDecimal getTotalAmount() {
		return totalAmount;
	}

	public BigDecimal getFinalAmount() {
		return finalAmount;
	}

	public String getCustomerName() {
		return customerName;
	}

	public String getCustomerEmail() {
		return customerEmail;
	}

	public String getCustomerPhone() {
		return customerPhone;
	}

	public String getAddress() {
		return address;
	}

	public String getCity() {
		return city;
	}

	public String getState() {
		return state;
	}

	public String getPincode() {
		return pincode;
	}

	public String getFulfillmentType() {
		return fulfillmentType;
	}

	public String getFulfillmentAddress() {
		return fulfillmentAddress;
	}

	public LocalDate getPreferredDate() {
		return preferredDate;
	}

	public String getPreferredTime() {
		return preferredTime;
	}

	public String getInstructions() {
		return instructions;
	}

	public String getPaymentMethod() {
		return paymentMethod;
	}

	public List<OrderItem> getItems() {
		return items;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
