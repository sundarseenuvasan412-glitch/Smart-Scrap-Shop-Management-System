package com.scrapworld.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
		Long id,
		String productKey,
		String productName,
		String imageUrl,
		BigDecimal pricePerKg,
		BigDecimal quantityKg,
		BigDecimal estimatedTotal,
		BigDecimal confirmedWeightKg,
		BigDecimal finalTotal) {
}
