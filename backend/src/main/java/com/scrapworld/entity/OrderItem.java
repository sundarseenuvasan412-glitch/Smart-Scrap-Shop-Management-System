package com.scrapworld.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "order_items")
public class OrderItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "order_id", nullable = false)
	private CustomerOrder order;

	@Column(name = "product_key", nullable = false, length = 100)
	private String productKey;

	@Column(name = "product_name", nullable = false, length = 150)
	private String productName;

	@Column(name = "image_url", length = 1000)
	private String imageUrl;

	@Column(name = "price_per_kg", nullable = false, precision = 12, scale = 2)
	private BigDecimal pricePerKg;

	@Column(name = "quantity_kg", nullable = false, precision = 12, scale = 3)
	private BigDecimal quantityKg;

	@Column(name = "estimated_total", nullable = false, precision = 12, scale = 2)
	private BigDecimal estimatedTotal;

	@Column(name = "confirmed_weight_kg", precision = 12, scale = 3)
	private BigDecimal confirmedWeightKg;

	@Column(name = "final_total", precision = 12, scale = 2)
	private BigDecimal finalTotal;

	protected OrderItem() {
	}

	public OrderItem(
			String productKey,
			String productName,
			String imageUrl,
			BigDecimal pricePerKg,
			BigDecimal quantityKg,
			BigDecimal estimatedTotal) {
		this.productKey = productKey;
		this.productName = productName;
		this.imageUrl = imageUrl;
		this.pricePerKg = pricePerKg;
		this.quantityKg = quantityKg;
		this.estimatedTotal = estimatedTotal;
	}

	void setOrder(CustomerOrder order) {
		this.order = order;
	}

	public void confirm(BigDecimal confirmedWeightKg, BigDecimal finalTotal) {
		this.confirmedWeightKg = confirmedWeightKg;
		this.finalTotal = finalTotal;
	}

	public Long getId() {
		return id;
	}

	public String getProductKey() {
		return productKey;
	}

	public String getProductName() {
		return productName;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public BigDecimal getPricePerKg() {
		return pricePerKg;
	}

	public BigDecimal getQuantityKg() {
		return quantityKg;
	}

	public BigDecimal getEstimatedTotal() {
		return estimatedTotal;
	}

	public BigDecimal getConfirmedWeightKg() {
		return confirmedWeightKg;
	}

	public BigDecimal getFinalTotal() {
		return finalTotal;
	}
}
