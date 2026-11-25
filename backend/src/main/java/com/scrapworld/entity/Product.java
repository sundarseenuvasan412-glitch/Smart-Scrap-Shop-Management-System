package com.scrapworld.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
public class Product {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 150)
	private String name;

	@Column(nullable = false, length = 100)
	private String category;

	@Column(name = "price_per_kg", nullable = false, precision = 12, scale = 2)
	private BigDecimal pricePerKg;

	@Column(name = "stock_kg", nullable = false, precision = 12, scale = 3)
	private BigDecimal stockKg;

	@Column(nullable = false)
	private boolean active = true;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected Product() {
	}

	public Product(String name, String category, BigDecimal pricePerKg, BigDecimal stockKg) {
		this.name = name;
		this.category = category;
		this.pricePerKg = pricePerKg;
		this.stockKg = stockKg;
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

	public String getName() {
		return name;
	}

	public String getCategory() {
		return category;
	}

	public BigDecimal getPricePerKg() {
		return pricePerKg;
	}

	public BigDecimal getStockKg() {
		return stockKg;
	}

	public boolean isActive() {
		return active;
	}
}
