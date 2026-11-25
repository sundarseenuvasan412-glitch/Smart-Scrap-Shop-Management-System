package com.scrapworld.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.scrapworld.dto.CreateOrderRequest;
import com.scrapworld.dto.CustomerOrderResponse;
import com.scrapworld.security.UserPrincipal;
import com.scrapworld.service.CustomerOrderService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
public class CustomerOrderController {

	private final CustomerOrderService orderService;

	public CustomerOrderController(CustomerOrderService orderService) {
		this.orderService = orderService;
	}

	@PostMapping
	@org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
	public CustomerOrderResponse create(
			@Valid @RequestBody CreateOrderRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return orderService.create(request, principal);
	}

	@GetMapping
	public List<CustomerOrderResponse> getMine(@AuthenticationPrincipal UserPrincipal principal) {
		return orderService.getCustomerOrders(principal);
	}

	@GetMapping("/{orderNumber}")
	public CustomerOrderResponse getMine(
			@PathVariable String orderNumber,
			@AuthenticationPrincipal UserPrincipal principal) {
		return orderService.getCustomerOrder(orderNumber, principal);
	}
}
