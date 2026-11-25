package com.scrapworld.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
		@NotBlank @Size(max = 100) String fullName,
		@NotBlank @Email @Size(max = 150) String email,
		@NotBlank @Size(max = 15) @Pattern(
				regexp = "^(?:\\+[1-9]\\d{6,13}|[1-9]\\d{6,14})$",
				message = "Enter a valid phone number") String phone,
		@NotBlank @Size(min = 8, max = 72) String password,
		@NotBlank String confirmPassword) {
}
