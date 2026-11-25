package com.scrapworld.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(String message, String token, String tokenType, AuthUserResponse user) {
}
