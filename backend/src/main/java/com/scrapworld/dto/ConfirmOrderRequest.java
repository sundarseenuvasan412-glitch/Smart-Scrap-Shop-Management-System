package com.scrapworld.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConfirmOrderRequest(
		@NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal finalAmount,
		@NotEmpty @Size(max = 50) List<@Valid ConfirmOrderItemRequest> items) {
}
