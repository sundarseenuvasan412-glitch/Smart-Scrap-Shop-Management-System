package com.scrapworld.controller;

import com.scrapworld.dto.AdminDashboardResponse;
import com.scrapworld.service.AdminDashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RequestMapping("/api/admin")
@RestController
public class AdminController {

	private final AdminDashboardService dashboardService;

	public AdminController(AdminDashboardService dashboardService) {
		this.dashboardService = dashboardService;
	}

	@GetMapping("/dashboard")
	public AdminDashboardResponse dashboard() {
		return dashboardService.getDashboard();
	}

	@GetMapping("/ping")
	public Map<String, String> ping() {
		return Map.of("message", "Admin access granted");
	}
}
