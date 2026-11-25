package com.scrapworld.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Size;

public record CreateOrderRequest(
		@NotBlank @Pattern(regexp = "PICKUP|DELIVERY") String fulfillmentType,
		@NotBlank @Size(max = 255) String address,
		@NotBlank @Size(max = 100) String city,
		@NotBlank @Size(max = 100) String state,
		@NotBlank @Pattern(regexp = "[0-9]{6}") String pincode,
		@NotBlank @Size(max = 255) String fulfillmentAddress,
		@NotNull LocalDate preferredDate,
		@NotBlank @Size(max = 50) String preferredTime,
		@Size(max = 1000) String instructions,
		@NotBlank @Pattern(regexp = "CASH_ON_PICKUP") String paymentMethod,
		@NotEmpty @Size(max = 50) List<@Valid OrderItemRequest> items) {
}
