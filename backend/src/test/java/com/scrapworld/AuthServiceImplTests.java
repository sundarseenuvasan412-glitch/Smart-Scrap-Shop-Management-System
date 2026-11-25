package com.scrapworld;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.scrapworld.dto.RegisterRequest;
import com.scrapworld.entity.Role;
import com.scrapworld.entity.User;
import com.scrapworld.exception.DuplicateEmailException;
import com.scrapworld.exception.PasswordMismatchException;
import com.scrapworld.repository.UserRepository;
import com.scrapworld.security.JwtService;
import com.scrapworld.service.impl.AuthServiceImpl;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTests {

	@Mock
	private UserRepository userRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private AuthenticationManager authenticationManager;

	@Mock
	private JwtService jwtService;

	@InjectMocks
	private AuthServiceImpl authService;

	@Test
	void registrationNormalizesEmailHashesPasswordAndAssignsCustomerRole() {
		when(userRepository.existsByEmailIgnoreCase("alex@example.com")).thenReturn(false);
		when(passwordEncoder.encode("Alex@123")).thenReturn("$2a$encoded");
		authService.register(new RegisterRequest(
				" Alex Morgan ", "Alex@Example.com", "9876543210", "Alex@123", "Alex@123"));

		ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
		verify(userRepository).save(userCaptor.capture());
		User savedUser = userCaptor.getValue();
		assertEquals("Alex Morgan", savedUser.getFullName());
		assertEquals("alex@example.com", savedUser.getEmail());
		assertEquals("$2a$encoded", savedUser.getPassword());
		assertEquals(Role.CUSTOMER, savedUser.getRole());
	}

	@Test
	void registrationRejectsDuplicateEmail() {
		when(userRepository.existsByEmailIgnoreCase("alex@example.com")).thenReturn(true);

		assertThrows(DuplicateEmailException.class, () -> authService.register(
				new RegisterRequest("Alex Morgan", "Alex@example.com", "9876543210", "Alex@123", "Alex@123")));
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void registrationRejectsMismatchedPasswords() {
		assertThrows(PasswordMismatchException.class, () -> authService.register(
				new RegisterRequest("Alex Morgan", "Alex@example.com", "9876543210", "Alex@123", "Different@123")));
		verify(userRepository, never()).save(any(User.class));
	}
}
