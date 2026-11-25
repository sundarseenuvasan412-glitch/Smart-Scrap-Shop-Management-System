package com.scrapworld.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.scrapworld.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

	long countByActiveTrue();
}
