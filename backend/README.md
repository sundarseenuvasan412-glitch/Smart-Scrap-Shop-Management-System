# ScrapWorld backend

Spring Boot REST API for the existing React application. The admin dashboard provides administrator-only access to customer, product, order, and paid-revenue metrics.

## Requirements

- JDK 21 or newer
- MySQL 8.0.16 or newer
- Maven 3.6.3 or newer (or use the included Maven Wrapper)
- Node.js and npm for the React frontend

The project uses Spring Boot 4.1.2 and targets Java 21.

## 1. Create the database

From the `backend` directory, create the application database using an existing MySQL administrator account:

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS scrapworld CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
```

Enter the administrator password only at the prompt. Do not put database passwords in source files or command arguments.

For production, use a dedicated MySQL account with access only to the `scrapworld` database rather than the root account.

## 2. Configure database and JWT secrets

For local development, you can put credentials in `backend/.env` as `KEY=value` entries. The file is git-ignored and Spring Boot loads it automatically when you start the backend from this directory. Environment variables set in your shell take precedence. Alternatively, set credentials in the same PowerShell window you use to start the backend. Never commit credentials or put passwords in command arguments:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "root"
$env:FRONTEND_ORIGIN = "http://localhost:5173"
$env:AUTH_COOKIE_SECURE = "false"

$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$jwtBytes = New-Object byte[] 32
$rng.GetBytes($jwtBytes)
$env:JWT_SECRET = [Convert]::ToBase64String($jwtBytes)
$rng.Dispose()
```

The default connection is `jdbc:mysql://localhost:3306/scrapworld`. Override it when needed:

```powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/scrapworld?serverTimezone=UTC"
```

`DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` are required. The application intentionally has no checked-in credentials or JWT signing key. Keep the generated signing key stable across restarts and use a secret manager in production. For production, provide these settings through environment variables or a secret manager rather than a local `.env` file.

## 3. Run the application

From the `backend` directory, activate the development profile. It lets Hibernate create/update local tables; the default profile uses `validate` and will not mutate a production schema.

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Alternatively, if Maven is installed:

```powershell
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Check `http://localhost:8080/actuator/health`. A successful database connection reports an `UP` status. The health endpoint does not expose database credentials or detailed component information.

The React app runs at `http://localhost:5173`; the API is `http://localhost:8080/api`.

## Configuration and schema policy

- `DB_URL` defaults to the local ScrapWorld database.
- `SERVER_PORT` optionally overrides port 8080.
- `JWT_SECRET` must be a Base64-encoded random key of at least 256 bits.
- `JWT_ACCESS_TOKEN_TTL` defaults to 15 minutes; `JWT_REMEMBER_TOKEN_TTL` defaults to 30 days.
- `AUTH_COOKIE_SECURE` defaults to `false` for local HTTP development. Set it to `true` behind HTTPS in production.
- `FRONTEND_ORIGIN` defaults to `http://localhost:5173` and is the only allowed credentialed CORS origin.
- Hibernate schema generation is `validate` by default. The `dev` profile uses `update` for local development; production schema changes should use reviewed migrations.
- The initial SQL script creates the empty database. The `users` table is created by Hibernate when the development profile is active. For an existing production database, apply `database/admin_dashboard_metrics.sql` before deploying the dashboard backend; it creates the product, order, and payment tables required by schema validation.

## Project layout

```text
src/main/java/com/scrapworld/
  controller/    AuthController, UserController, AdminController
  dto/           RegisterRequest, LoginRequest, AuthResponse, response DTOs
  entity/        User, Role, Product, CustomerOrder, Payment and their statuses
  exception/     GlobalExceptionHandler and auth exceptions
  repository/    UserRepository, ProductRepository, CustomerOrderRepository, PaymentRepository
  security/      SecurityConfig, JwtService, JwtAuthenticationFilter, UserPrincipal
  service/       AuthService
  service/impl/  AuthServiceImpl
src/main/resources/application.yml
src/main/resources/application-dev.yml
database/schema.sql
```

## Login, registration, and admin access

The React pages at `/login` and `/register` share the existing site navigation, footer and green visual theme. Registration accepts a name, unique email, E.164-style phone number, password, confirmation and terms acceptance. Every self-registered account receives `CUSTOMER`; there is no role field in the registration API. Provision administrator accounts through a trusted operator process, never through public registration.

| Method | Endpoint | Access |
|---|---|---|
| `GET` | `/api/auth/csrf` | Public; initializes the CSRF cookie |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/admin/login` | Public; accepts only administrator accounts |
| `POST` | `/api/auth/logout` | Public; clears the auth cookie |
| `GET` | `/api/auth/me` | Authenticated |
| `GET` | `/api/admin/dashboard` | `ADMIN` only |
| `GET` | `/api/users/me` | Authenticated |
| `GET` | `/api/products/**` | Public |
| `/api/admin/**` | Any method | `ADMIN` only |
| `/api/users/**` | Any method | Authenticated |

State-changing requests must include the `X-XSRF-TOKEN` header matching the `XSRF-TOKEN` cookie. The frontend Axios client obtains and sends this token automatically.

There is no public administrator registration or default admin account. A trusted operator must provision the first `ADMIN` row directly in the database with a BCrypt-encoded password. For example, generate the hash locally with Spring Security's `BCryptPasswordEncoder`, then insert the account through a trusted SQL client:

```sql
INSERT INTO users (full_name, email, phone, password, role, created_at)
VALUES ('ScrapWorld Admin', 'admin@example.com', '9876543210', 'admin123', 'ADMIN', CURRENT_TIMESTAMP);
```

The admin sign-in screen is available at `http://localhost:5173/admin/login`. It posts credentials to `/api/auth/admin/login`; the backend rejects customer-role accounts and sets the same HttpOnly authentication cookie used by the rest of the application. Admin API authorization is enforced by Spring Security, not only by frontend route guards.

The dashboard endpoint returns `customerCount`, `productCount` (active products), `orderCount` (all statuses), total `revenue` (payments with `PAID` status only), and six calendar months of `monthlyMetrics` (orders and paid revenue). Empty tables produce zero counts and revenue. Refunds and pending payments are excluded from revenue. The new data model stores product stock in kilograms and associates each order with its customer; CRUD pages for those records remain a separate development step. Inventory, enquiry, and selling-request figures are not included.

### Postman checks for the admin module

1. `GET http://localhost:8080/api/auth/csrf`; retain the `XSRF-TOKEN` cookie and copy the response's `token`.
2. `POST http://localhost:8080/api/auth/admin/login` with the cookie jar, `X-XSRF-TOKEN: <token>`, and JSON body:

   ```json
   { "email": "admin@example.com", "password": "admin123", "rememberMe": false }
   ```

   The response sets an HttpOnly `SCRAPWORLD_AUTH` cookie and returns the administrator profile without returning the JWT.
3. `GET http://localhost:8080/api/admin/dashboard` with the cookie jar. The response includes the four headline metrics and six monthly trend entries, for example `{ "customerCount": 12, "productCount": 4, "orderCount": 19, "revenue": 15300.00, "monthlyMetrics": [{ "month": "2026-06", "orderCount": 2, "revenue": 1500.00 }] }`.
4. Repeat step 2 using a CUSTOMER account: the endpoint returns `401`. Call `/api/admin/dashboard` with a customer cookie: the endpoint returns `403`.

Registration request:

```json
{
  "fullName": "Alex Morgan",
  "email": "alex@example.com",
  "phone": "9876543210",
  "password": "Alex@123",
  "confirmPassword": "Alex@123"
}
```

Successful registration returns `201`:

```json
{ "message": "Registration successful", "success": true }
```

Login request:

```json
{
  "email": "alex@example.com",
  "password": "Alex@123",
  "rememberMe": false
}
```

Successful login returns the user and `tokenType: "Bearer"` and sets the signed JWT in an `HttpOnly` cookie. The JWT is intentionally omitted from the JSON body: JavaScript cannot read it, which reduces token theft in an XSS incident. The cookie is sent automatically by Axios. `rememberMe` selects a session cookie/15-minute token or a persistent 30-day cookie/token.

Example login response:

```json
{
  "message": "Login successful",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "fullName": "Alex Morgan",
    "email": "alex@example.com",
    "role": "CUSTOMER"
  }
}
```

HttpOnly cookies mitigate token exfiltration compared with `localStorage`, which is readable by injected JavaScript, but cookies require CSRF protections. This implementation uses a separate CSRF cookie/header, `SameSite=Lax`, credentialed CORS restricted to one configured frontend origin, and supports enabling `Secure` for HTTPS. Keep the frontend and API on the same site in production; cross-site deployments need an explicit cookie/CORS review.

### Password recovery

The forgot-password and reset-password pages are placeholders only. Email verification, secure time-limited reset tokens and email delivery are not configured, so the UI explicitly says password recovery is unavailable.

### Postman checks

Import [`postman/ScrapWorld-Auth.postman_collection.json`](./postman/ScrapWorld-Auth.postman_collection.json) and run the requests in order. The collection covers successful registration, duplicate/invalid email, password mismatch, successful/failed/incomplete login, anonymous access to a protected endpoint, and customer access to an admin endpoint. It obtains the CSRF token first and relies on Postman's localhost cookie jar for the HttpOnly login cookie.

### Tests

```powershell
.\mvnw.cmd test
```

Backend tests use an in-memory H2 database and a test-only signing key. The frontend checks are:

```powershell
cd ..\frontend
npm run lint
npm test
npm run build
```
