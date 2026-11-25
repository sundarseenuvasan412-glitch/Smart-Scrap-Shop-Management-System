package com.scrapworld.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

public record ConfirmOrderItemRequest(
		@NotNull Long id,
		@NotNull @DecimalMin("0.001") @Digits(integer = 9, fraction = 3) BigDecimal confirmedWeightKg,
		@NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal finalTotal) {
}
