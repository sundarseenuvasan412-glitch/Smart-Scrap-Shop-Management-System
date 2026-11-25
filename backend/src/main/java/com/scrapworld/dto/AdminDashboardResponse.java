package com.scrapworld.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardResponse(
		long customerCount,
		long productCount,
		long orderCount,
		BigDecimal revenue,
		List<MonthlyDashboardMetric> monthlyMetrics) {
}
