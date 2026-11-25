package com.scrapworld.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.scrapworld.dto.MonthlyPaymentRevenue;
import com.scrapworld.entity.Payment;
import com.scrapworld.entity.PaymentStatus;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

	java.util.Optional<Payment> findFirstByOrder_IdOrderByIdDesc(Long orderId);

	@Query("select sum(payment.amount) from Payment payment where payment.status = :status")
	BigDecimal sumAmountByStatus(@Param("status") PaymentStatus status);

	@Query(value = """
			select year(paid_at) as calendarYear, month(paid_at) as calendarMonth, sum(amount) as revenue
			from payments
			where status = 'PAID' and paid_at >= :since
			group by year(paid_at), month(paid_at)
			""", nativeQuery = true)
	List<MonthlyPaymentRevenue> sumRevenueByMonthSince(@Param("since") Instant since);
}
