package com.scrapworld.service;

import com.scrapworld.dto.AuthResponse;
import com.scrapworld.dto.RegisterRequest;
import com.scrapworld.dto.RegistrationResponse;
import com.scrapworld.dto.LoginRequest;
import com.scrapworld.security.UserPrincipal;

public interface AuthService {

	RegistrationResponse register(RegisterRequest request);

	AuthResponse login(LoginRequest request);

	AuthResponse adminLogin(LoginRequest request);

	UserPrincipal getCurrentUser(String email);
}
