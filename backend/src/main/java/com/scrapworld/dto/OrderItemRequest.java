package com.scrapworld.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OrderItemRequest(
		@NotBlank @Size(max = 100) String productKey,
		@NotBlank @Size(max = 150) String productName,
		@Size(max = 1000) String imageUrl,
		@NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal pricePerKg,
		@NotNull @DecimalMin("0.001") @Digits(integer = 9, fraction = 3) BigDecimal quantityKg) {
}
