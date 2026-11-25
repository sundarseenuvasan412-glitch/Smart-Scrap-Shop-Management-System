ALTER TABLE customer_orders
    ADD COLUMN final_amount DECIMAL(12, 2) NULL,
    ADD COLUMN customer_name VARCHAR(100) NULL,
    ADD COLUMN customer_email VARCHAR(150) NULL,
    ADD COLUMN customer_phone VARCHAR(15) NULL,
    ADD COLUMN address VARCHAR(255) NULL,
    ADD COLUMN city VARCHAR(100) NULL,
    ADD COLUMN state VARCHAR(100) NULL,
    ADD COLUMN pincode VARCHAR(10) NULL,
    ADD COLUMN fulfillment_type VARCHAR(20) NULL,
    ADD COLUMN fulfillment_address VARCHAR(255) NULL,
    ADD COLUMN preferred_date DATE NULL,
    ADD COLUMN preferred_time VARCHAR(50) NULL,
    ADD COLUMN instructions VARCHAR(1000) NULL,
    ADD COLUMN payment_method VARCHAR(30) NULL;

UPDATE customer_orders o
JOIN users u ON u.id = o.customer_id
SET o.customer_name = u.full_name,
    o.customer_email = u.email,
    o.customer_phone = u.phone,
    o.address = 'Not provided',
    o.city = 'Not provided',
    o.state = 'Not provided',
    o.pincode = '000000',
    o.fulfillment_type = 'PICKUP',
    o.fulfillment_address = 'Not provided',
    o.preferred_date = DATE(o.created_at),
    o.preferred_time = 'To be arranged',
    o.payment_method = 'CASH_ON_PICKUP'
WHERE o.customer_name IS NULL;

ALTER TABLE customer_orders
    MODIFY customer_name VARCHAR(100) NOT NULL,
    MODIFY customer_email VARCHAR(150) NOT NULL,
    MODIFY customer_phone VARCHAR(15) NOT NULL,
    MODIFY address VARCHAR(255) NOT NULL,
    MODIFY city VARCHAR(100) NOT NULL,
    MODIFY state VARCHAR(100) NOT NULL,
    MODIFY pincode VARCHAR(10) NOT NULL,
    MODIFY fulfillment_type VARCHAR(20) NOT NULL,
    MODIFY fulfillment_address VARCHAR(255) NOT NULL,
    MODIFY preferred_date DATE NOT NULL,
    MODIFY preferred_time VARCHAR(50) NOT NULL,
    MODIFY payment_method VARCHAR(30) NOT NULL;

CREATE TABLE order_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_key VARCHAR(100) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    image_url VARCHAR(1000) NULL,
    price_per_kg DECIMAL(12, 2) NOT NULL,
    quantity_kg DECIMAL(12, 3) NOT NULL,
    estimated_total DECIMAL(12, 2) NOT NULL,
    confirmed_weight_kg DECIMAL(12, 3) NULL,
    final_total DECIMAL(12, 2) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES customer_orders (id)
);
