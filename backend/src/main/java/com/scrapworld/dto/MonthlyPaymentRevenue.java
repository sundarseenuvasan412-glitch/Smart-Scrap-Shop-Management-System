package com.scrapworld.dto;

import java.math.BigDecimal;

public interface MonthlyPaymentRevenue {

	Integer getCalendarYear();

	Integer getCalendarMonth();

	BigDecimal getRevenue();
}
