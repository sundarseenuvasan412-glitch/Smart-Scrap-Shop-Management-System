package com.scrapworld.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.scrapworld.dto.MonthlyOrderCount;
import com.scrapworld.entity.CustomerOrder;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

	List<CustomerOrder> findByCustomer_IdOrderByCreatedAtDesc(Long customerId);

	List<CustomerOrder> findAllByOrderByCreatedAtDesc();

	java.util.Optional<CustomerOrder> findByOrderNumber(String orderNumber);

	@Query(value = """
			select year(created_at) as calendarYear, month(created_at) as calendarMonth, count(*) as orderCount
			from customer_orders
			where created_at >= :since
			group by year(created_at), month(created_at)
			""", nativeQuery = true)
	List<MonthlyOrderCount> countOrdersByMonthSince(@Param("since") Instant since);
}
