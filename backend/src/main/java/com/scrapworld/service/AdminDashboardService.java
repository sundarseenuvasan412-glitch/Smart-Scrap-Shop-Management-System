package com.scrapworld.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.scrapworld.dto.AdminDashboardResponse;
import com.scrapworld.dto.MonthlyDashboardMetric;
import com.scrapworld.dto.MonthlyOrderCount;
import com.scrapworld.dto.MonthlyPaymentRevenue;
import com.scrapworld.entity.PaymentStatus;
import com.scrapworld.entity.Role;
import com.scrapworld.repository.CustomerOrderRepository;
import com.scrapworld.repository.PaymentRepository;
import com.scrapworld.repository.ProductRepository;
import com.scrapworld.repository.UserRepository;

@Service
public class AdminDashboardService {

	private static final int MONTHS_TO_DISPLAY = 6;

	private final UserRepository userRepository;
	private final ProductRepository productRepository;
	private final CustomerOrderRepository orderRepository;
	private final PaymentRepository paymentRepository;

	public AdminDashboardService(
			UserRepository userRepository,
			ProductRepository productRepository,
			CustomerOrderRepository orderRepository,
			PaymentRepository paymentRepository) {
		this.userRepository = userRepository;
		this.productRepository = productRepository;
		this.orderRepository = orderRepository;
		this.paymentRepository = paymentRepository;
	}

	@Transactional(readOnly = true)
	public AdminDashboardResponse getDashboard() {
		YearMonth currentMonth = YearMonth.now(ZoneOffset.UTC);
		Instant since = currentMonth.minusMonths(MONTHS_TO_DISPLAY - 1)
				.atDay(1)
				.atStartOfDay()
				.toInstant(ZoneOffset.UTC);

		Map<YearMonth, Long> monthlyOrders = new HashMap<>();
		for (MonthlyOrderCount month : orderRepository.countOrdersByMonthSince(since)) {
			monthlyOrders.put(YearMonth.of(month.getCalendarYear(), month.getCalendarMonth()), month.getOrderCount());
		}

		Map<YearMonth, BigDecimal> monthlyRevenue = new HashMap<>();
		for (MonthlyPaymentRevenue month : paymentRepository.sumRevenueByMonthSince(since)) {
			monthlyRevenue.put(YearMonth.of(month.getCalendarYear(), month.getCalendarMonth()), month.getRevenue());
		}

		List<MonthlyDashboardMetric> monthlyMetrics = new ArrayList<>(MONTHS_TO_DISPLAY);
		for (int offset = MONTHS_TO_DISPLAY - 1; offset >= 0; offset--) {
			YearMonth month = currentMonth.minusMonths(offset);
			monthlyMetrics.add(new MonthlyDashboardMetric(
					month.toString(),
					monthlyOrders.getOrDefault(month, 0L),
					monthlyRevenue.getOrDefault(month, BigDecimal.ZERO)));
		}

		BigDecimal revenue = paymentRepository.sumAmountByStatus(PaymentStatus.PAID);
		return new AdminDashboardResponse(
				userRepository.countByRole(Role.CUSTOMER),
				productRepository.countByActiveTrue(),
				orderRepository.count(),
				revenue == null ? BigDecimal.ZERO : revenue,
				List.copyOf(monthlyMetrics));
	}
}
