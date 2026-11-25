package com.scrapworld.controller;

import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.scrapworld.dto.AuthResponse;
import com.scrapworld.dto.LoginRequest;
import com.scrapworld.dto.RegisterRequest;
import com.scrapworld.dto.RegistrationResponse;
import com.scrapworld.security.JwtService;
import com.scrapworld.security.UserPrincipal;
import com.scrapworld.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;
	private final JwtService jwtService;
	private final String cookieName;
	private final boolean cookieSecure;

	public AuthController(
			AuthService authService,
			JwtService jwtService,
			@Value("${app.auth.cookie-name:SCRAPWORLD_AUTH}") String cookieName,
			@Value("${app.auth.cookie-secure}") boolean cookieSecure) {
		this.authService = authService;
		this.jwtService = jwtService;
		this.cookieName = cookieName;
		this.cookieSecure = cookieSecure;
	}

	@GetMapping("/csrf")
	public Map<String, String> csrf(CsrfToken csrfToken) {
		return Map.of("token", csrfToken.getToken());
	}

	@PostMapping("/register")
	public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody RegisterRequest request) {
		return ResponseEntity.status(201).body(authService.register(request));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		return createLoginResponse(authService.login(request), request);
	}

	@PostMapping("/admin/login")
	public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody LoginRequest request) {
		return createLoginResponse(authService.adminLogin(request), request);
	}

	private ResponseEntity<AuthResponse> createLoginResponse(AuthResponse result, LoginRequest request) {
		Duration ttl = jwtService.getTokenTtl(request.rememberMe());
		ResponseCookie authCookie = ResponseCookie.from(cookieName, result.token())
				.httpOnly(true)
				.secure(cookieSecure)
				.sameSite("Lax")
				.path("/")
				.maxAge(request.rememberMe() ? ttl : Duration.ofSeconds(-1))
				.build();
		return ResponseEntity.ok()
				.header(HttpHeaders.SET_COOKIE, authCookie.toString())
				.body(result);
	}

	@PostMapping("/logout")
	public ResponseEntity<Map<String, String>> logout() {
		ResponseCookie clearedCookie = ResponseCookie.from(cookieName, "")
				.httpOnly(true)
				.secure(cookieSecure)
				.sameSite("Lax")
				.path("/")
				.maxAge(Duration.ZERO)
				.build();
		return ResponseEntity.ok()
				.header(HttpHeaders.SET_COOKIE, clearedCookie.toString())
				.body(Map.of("message", "Logged out"));
	}

	@GetMapping("/me")
	public Map<String, Object> currentUser(@AuthenticationPrincipal UserPrincipal principal) {
		return Map.of(
				"id", principal.id(),
				"fullName", principal.fullName(),
				"email", principal.email(),
				"role", principal.role());
	}
}
