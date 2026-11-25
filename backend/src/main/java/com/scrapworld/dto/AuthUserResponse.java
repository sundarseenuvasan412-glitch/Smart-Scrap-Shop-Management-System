package com.scrapworld.dto;

import com.scrapworld.entity.Role;

public record AuthUserResponse(Long id, String fullName, String email, Role role) {
}
