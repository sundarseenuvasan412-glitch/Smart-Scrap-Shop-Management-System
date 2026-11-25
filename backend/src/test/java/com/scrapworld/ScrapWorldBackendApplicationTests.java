package com.scrapworld;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;

import com.scrapworld.entity.Role;
import com.scrapworld.entity.User;
import com.scrapworld.entity.CustomerOrder;
import com.scrapworld.entity.OrderStatus;
import com.scrapworld.entity.Payment;
import com.scrapworld.entity.PaymentStatus;
import com.scrapworld.entity.Product;
import com.scrapworld.repository.CustomerOrderRepository;
import com.scrapworld.repository.PaymentRepository;
import com.scrapworld.repository.ProductRepository;
import com.scrapworld.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ScrapWorldBackendApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private ProductRepository productRepository;

	@Autowired
	private CustomerOrderRepository orderRepository;

	@Autowired
	private PaymentRepository paymentRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@BeforeEach
	void clearDashboardData() {
		paymentRepository.deleteAll();
		orderRepository.deleteAll();
		productRepository.deleteAll();
		userRepository.deleteAll();
	}

	@Test
	void contextLoads() {
	}

	@Test
	void registrationLoginAndAuthorizationWorkWithCsrfAndBearerToken() throws Exception {
		MvcResult csrfResult = mockMvc.perform(get("/api/auth/csrf"))
				.andExpect(status().isOk())
				.andReturn();
		String csrfToken = objectMapper.readTree(csrfResult.getResponse().getContentAsString())
				.path("token")
				.asText();
		Cookie csrfCookie = responseCookie(csrfResult, "XSRF-TOKEN");

		String registration = """
				{"fullName":"Alex Morgan","email":"alex@example.com","phone":"9876543210",
				"password":"Alex@123","confirmPassword":"Alex@123"}
				""";
		mockMvc.perform(post("/api/auth/register")
						.cookie(csrfCookie)
						.header("X-XSRF-TOKEN", csrfToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content(registration))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.success").value(true));

		String login = """
				{"email":"alex@example.com","password":"Alex@123","rememberMe":false}
				""";
		MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
						.cookie(csrfCookie)
						.header("X-XSRF-TOKEN", csrfToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content(login))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.tokenType").value("Bearer"))
				.andExpect(jsonPath("$.user.role").value("CUSTOMER"))
				.andReturn();
		String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
				.path("token")
				.asText();
		org.junit.jupiter.api.Assertions.assertFalse(token.isBlank());
		String authCookieHeader = responseCookieHeader(loginResult, "SCRAPWORLD_AUTH");
		org.junit.jupiter.api.Assertions.assertTrue(authCookieHeader.contains("HttpOnly"));

		mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("alex@example.com"));
		mockMvc.perform(get("/api/admin/ping").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/admin/dashboard").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/users/me"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void adminCanSignInAndReadDatabaseBackedDashboard() throws Exception {
		User customer = userRepository.save(new User(
				"Alex Morgan", "alex@example.com", "9876543210", passwordEncoder.encode("Alex@123"), Role.CUSTOMER));
		userRepository.save(new User(
				"Sam Admin", "admin@example.com", "9876543211", passwordEncoder.encode("Admin@123"), Role.ADMIN));
		productRepository.save(new Product(
				"Copper Scrap", "Non-ferrous metals", new BigDecimal("450.00"), new BigDecimal("680.000")));
		CustomerOrder paidOrder = orderRepository.save(new CustomerOrder(
				"SW-1001", customer, OrderStatus.DELIVERED, new BigDecimal("950.00")));
		CustomerOrder pendingOrder = orderRepository.save(new CustomerOrder(
				"SW-1002", customer, OrderStatus.PENDING, new BigDecimal("80.00")));
		paymentRepository.save(new Payment(
				paidOrder, new BigDecimal("950.00"), PaymentStatus.PAID, Instant.now()));
		paymentRepository.save(new Payment(
				pendingOrder, new BigDecimal("80.00"), PaymentStatus.PENDING, null));

		MvcResult csrfResult = mockMvc.perform(get("/api/auth/csrf"))
				.andExpect(status().isOk())
				.andReturn();
		String csrfToken = objectMapper.readTree(csrfResult.getResponse().getContentAsString())
				.path("token")
				.asText();
		Cookie csrfCookie = responseCookie(csrfResult, "XSRF-TOKEN");

		MvcResult loginResult = mockMvc.perform(post("/api/auth/admin/login")
						.cookie(csrfCookie)
						.header("X-XSRF-TOKEN", csrfToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"email":"admin@example.com","password":"Admin@123","rememberMe":false}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.user.role").value("ADMIN"))
				.andReturn();
		String token = objectMapper.readTree(loginResult.getResponse().getContentAsString()).path("token").asText();

		mockMvc.perform(get("/api/admin/dashboard").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.customerCount").value(1))
				.andExpect(jsonPath("$.productCount").value(1))
				.andExpect(jsonPath("$.orderCount").value(2))
				.andExpect(jsonPath("$.revenue").value(950.00))
				.andExpect(jsonPath("$.monthlyMetrics.length()").value(6))
				.andExpect(jsonPath("$.monthlyMetrics[5].orderCount").value(2))
				.andExpect(jsonPath("$.monthlyMetrics[5].revenue").value(950.00));
	}

	@Test
	void customerCannotUseAdminLoginEndpoint() throws Exception {
		userRepository.save(new User(
				"Alex Morgan", "alex@example.com", "9876543210", passwordEncoder.encode("Alex@123"), Role.CUSTOMER));

		MvcResult csrfResult = mockMvc.perform(get("/api/auth/csrf"))
				.andExpect(status().isOk())
				.andReturn();
		String csrfToken = objectMapper.readTree(csrfResult.getResponse().getContentAsString())
				.path("token")
				.asText();

		mockMvc.perform(post("/api/auth/admin/login")
						.cookie(responseCookie(csrfResult, "XSRF-TOKEN"))
						.header("X-XSRF-TOKEN", csrfToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"email":"alex@example.com","password":"Alex@123","rememberMe":false}
								"""))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Email or password is incorrect"));
	}

	@Test
	void customerCanPlaceOrderAndAdminMustConfirmFinalPriceBeforePayment() throws Exception {
		userRepository.save(new User(
				"Alex Morgan", "alex@example.com", "9876543210", passwordEncoder.encode("Alex@123"), Role.CUSTOMER));
		userRepository.save(new User(
				"Sam Admin", "admin@example.com", "9876543211", passwordEncoder.encode("Admin@123"), Role.ADMIN));

		MvcResult csrfResult = mockMvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
		String csrfToken = objectMapper.readTree(csrfResult.getResponse().getContentAsString()).path("token").asText();
		Cookie csrfCookie = responseCookie(csrfResult, "XSRF-TOKEN");
		MvcResult customerLogin = mockMvc.perform(post("/api/auth/login")
						.cookie(csrfCookie)
						.header("X-XSRF-TOKEN", csrfToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"email":"alex@example.com","password":"Alex@123","rememberMe":false}
								"""))
				.andExpect(status().isOk())
				.andReturn();
		String customerToken = objectMapper.readTree(customerLogin.getResponse().getContentAsString()).path("token").asText();

		MvcResult placed = mockMvc.perform(post("/api/orders")
								.cookie(csrfCookie)
								.header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken)
						.header("X-XSRF-TOKEN", csrfToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "fulfillmentType":"PICKUP",
								  "address":"12 Green Street",
								  "city":"Pune",
								  "state":"Maharashtra",
								  "pincode":"411001",
								  "fulfillmentAddress":"12 Green Street, Pune",
								  "preferredDate":"2027-01-15",
								  "preferredTime":"9:00 AM - 12:00 PM",
								  "instructions":"Call before arrival",
								  "paymentMethod":"CASH_ON_PICKUP",
								  "items":[{
								    "productKey":"iron",
								    "productName":"Iron Scrap",
								    "imageUrl":"https://example.com/iron.jpg",
								    "pricePerKg":30,
								    "quantityKg":2.5
								  }]
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.status").value("PENDING"))
				.andExpect(jsonPath("$.paymentStatus").value("PENDING"))
				.andExpect(jsonPath("$.estimatedAmount").value(75.00))
				.andReturn();
		var placedJson = objectMapper.readTree(placed.getResponse().getContentAsString());
		String orderNumber = placedJson.path("orderNumber").asText();
		long itemId = placedJson.path("items").get(0).path("id").asLong();

		mockMvc.perform(get("/api/orders/" + orderNumber)
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items[0].quantityKg").value(2.5));
		mockMvc.perform(get("/api/admin/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken))
				.andExpect(status().isForbidden());

		MvcResult adminLogin = mockMvc.perform(post("/api/auth/admin/login")
						.cookie(csrfCookie)
						.header("X-XSRF-TOKEN", csrfToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"email":"admin@example.com","password":"Admin@123","rememberMe":false}
								"""))
				.andExpect(status().isOk())
				.andReturn();
		String adminToken = objectMapper.readTree(adminLogin.getResponse().getContentAsString()).path("token").asText();
		mockMvc.perform(get("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
						.andExpect(status().isForbidden());

		mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/payment-received")
								.cookie(csrfCookie)
								.header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
						.header("X-XSRF-TOKEN", csrfToken))
				.andExpect(status().isBadRequest());

		mockMvc.perform(put("/api/admin/orders/" + orderNumber + "/final-price")
						.cookie(csrfCookie)
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
						.header("X-XSRF-TOKEN", csrfToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"finalAmount":80.00,"items":[{"id":%d,"confirmedWeightKg":2.0,"finalTotal":80.00}]}
								""".formatted(itemId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.finalAmount").value(80.00))
				.andExpect(jsonPath("$.paymentStatus").value("PENDING"));

		mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/payment-received")
						.cookie(csrfCookie)
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
						.header("X-XSRF-TOKEN", csrfToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.finalAmount").value(80.00))
				.andExpect(jsonPath("$.paymentStatus").value("PAID"));

		mockMvc.perform(patch("/api/admin/orders/" + orderNumber + "/status")
						.cookie(csrfCookie)
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
						.header("X-XSRF-TOKEN", csrfToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"status":"CONFIRMED"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("CONFIRMED"));

		mockMvc.perform(get("/api/admin/dashboard").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.revenue").value(80.00));

		mockMvc.perform(post("/api/auth/logout")
						.cookie(csrfCookie)
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken)
						.header("X-XSRF-TOKEN", csrfToken))
				.andExpect(status().isOk());
		mockMvc.perform(get("/api/orders").cookie(csrfCookie))
				.andExpect(status().isUnauthorized());
	}

	private Cookie responseCookie(MvcResult result, String name) {
		String header = responseCookieHeader(result, name);
		String value = header.substring(name.length() + 1).split(";", 2)[0];
		return new Cookie(name, value);
	}

	private String responseCookieHeader(MvcResult result, String name) {
		List<String> cookies = result.getResponse().getHeaders(HttpHeaders.SET_COOKIE);
		return cookies.stream()
				.filter(cookie -> cookie.startsWith(name + "="))
				.findFirst()
				.orElseThrow(() -> new AssertionError("Missing " + name + " cookie"));
	}
}
