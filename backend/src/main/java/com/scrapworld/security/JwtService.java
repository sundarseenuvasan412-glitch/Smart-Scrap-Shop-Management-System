package com.scrapworld.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.scrapworld.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	private final SecretKey signingKey;
	private final Duration accessTokenTtl;
	private final Duration rememberTokenTtl;

	public JwtService(
			@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.access-token-ttl}") Duration accessTokenTtl,
			@Value("${app.jwt.remember-token-ttl}") Duration rememberTokenTtl) {
		this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
		this.accessTokenTtl = accessTokenTtl;
		this.rememberTokenTtl = rememberTokenTtl;
	}

	public String generateToken(User user, boolean rememberMe) {
		Instant issuedAt = Instant.now();
		Instant expiresAt = issuedAt.plus(getTokenTtl(rememberMe));

		return Jwts.builder()
				.subject(user.getEmail())
				.claim("uid", user.getId())
				.claim("name", user.getFullName())
				.claim("role", user.getRole().name())
				.issuedAt(Date.from(issuedAt))
				.expiration(Date.from(expiresAt))
				.signWith(signingKey)
				.compact();
	}

	public Claims parseClaims(String token) {
		return Jwts.parser()
				.verifyWith(signingKey)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public Duration getTokenTtl(boolean rememberMe) {
		return rememberMe ? rememberTokenTtl : accessTokenTtl;
	}
}
