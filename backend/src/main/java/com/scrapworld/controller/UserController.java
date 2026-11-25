package com.scrapworld.controller;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.scrapworld.security.UserPrincipal;
import com.scrapworld.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserRepository userRepository;

	public UserController(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@GetMapping("/me")
	public Map<String, Object> currentUser(@AuthenticationPrincipal UserPrincipal principal) {
		var user = userRepository.findById(principal.id())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer account not found"));
		return Map.of(
				"id", user.getId(),
				"fullName", user.getFullName(),
				"email", user.getEmail(),
				"phone", user.getPhone(),
				"role", user.getRole());
	}
}
