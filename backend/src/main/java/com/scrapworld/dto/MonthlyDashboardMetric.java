package com.scrapworld.dto;

import java.math.BigDecimal;

public record MonthlyDashboardMetric(String month, long orderCount, BigDecimal revenue) {
}
