package com.scrapworld.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.scrapworld.entity.Role;
import com.scrapworld.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);

	long countByRole(Role role);
}
