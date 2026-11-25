package com.scrapworld.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record CustomerOrderResponse(
		String orderNumber,
		Instant createdAt,
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
		String status,
		BigDecimal estimatedAmount,
		BigDecimal finalAmount,
		String paymentMethod,
		String paymentStatus,
		List<OrderItemResponse> items) {
}
