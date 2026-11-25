package com.scrapworld.service.impl;

import java.util.Locale;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.scrapworld.dto.AuthResponse;
import com.scrapworld.dto.AuthUserResponse;
import com.scrapworld.dto.LoginRequest;
import com.scrapworld.dto.RegisterRequest;
import com.scrapworld.dto.RegistrationResponse;
import com.scrapworld.entity.Role;
import com.scrapworld.entity.User;
import com.scrapworld.exception.DuplicateEmailException;
import com.scrapworld.exception.PasswordMismatchException;
import com.scrapworld.repository.UserRepository;
import com.scrapworld.security.JwtService;
import com.scrapworld.security.UserPrincipal;
import com.scrapworld.service.AuthService;

import org.springframework.security.core.userdetails.UsernameNotFoundException;

@Service
public class AuthServiceImpl implements AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;

	public AuthServiceImpl(
			UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			AuthenticationManager authenticationManager,
			JwtService jwtService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
	}

	@Override
	@Transactional
	public RegistrationResponse register(RegisterRequest request) {
		String email = normalizeEmail(request.email());
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new DuplicateEmailException();
		}
		if (!request.password().equals(request.confirmPassword())) {
			throw new PasswordMismatchException();
		}
		if (request.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
			throw new IllegalArgumentException("Password must be no more than 72 UTF-8 bytes");
		}

		User user = new User(
				request.fullName().trim(),
				email,
				request.phone(),
				passwordEncoder.encode(request.password()),
				Role.CUSTOMER);
		userRepository.save(user);
		return new RegistrationResponse("Registration successful", true);
	}

	@Override
	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest request) {
		return authenticate(request, false);
	}

	@Override
	@Transactional(readOnly = true)
	public AuthResponse adminLogin(LoginRequest request) {
		return authenticate(request, true);
	}

	private AuthResponse authenticate(LoginRequest request, boolean adminOnly) {
		String email = normalizeEmail(request.email());
		Authentication authentication = authenticationManager.authenticate(
				UsernamePasswordAuthenticationToken.unauthenticated(email, request.password()));
		UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
		User user = userRepository.findById(principal.id())
				.orElseThrow(() -> new UsernameNotFoundException("User no longer exists"));
		if (adminOnly && user.getRole() != Role.ADMIN) {
			throw new BadCredentialsException("Invalid administrator credentials");
		}

		return new AuthResponse(
				"Login successful",
				jwtService.generateToken(user, request.rememberMe()),
				"Bearer",
				new AuthUserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole()));
	}

	@Override
	@Transactional(readOnly = true)
	public UserPrincipal getCurrentUser(String email) {
		User user = userRepository.findByEmailIgnoreCase(email)
				.orElseThrow(() -> new UsernameNotFoundException("User no longer exists"));
		return new UserPrincipal(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), "");
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}

}
