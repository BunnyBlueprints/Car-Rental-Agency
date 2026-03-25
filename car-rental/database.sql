-- CREATE DATABASE IF NOT EXISTS car_rental_db
--   CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;

-- USE car_rental_db;

CREATE TABLE IF NOT EXISTS users (
  id         INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(180) NOT NULL,
  password   VARCHAR(255) NOT NULL,          -- bcrypt hash
  role       ENUM('CUSTOMER', 'AGENCY') NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cars (
  id               INT            NOT NULL AUTO_INCREMENT,
  agency_id        INT            NOT NULL,
  vehicle_model    VARCHAR(120)   NOT NULL,
  vehicle_number   VARCHAR(20)    NOT NULL,
  seating_capacity TINYINT        NOT NULL CHECK (seating_capacity > 0),
  rent_per_day     DECIMAL(10,2)  NOT NULL CHECK (rent_per_day > 0),

  PRIMARY KEY (id),
  UNIQUE KEY uq_cars_vehicle_number (vehicle_number),
  CONSTRAINT fk_cars_agency
    FOREIGN KEY (agency_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  id             INT           NOT NULL AUTO_INCREMENT,
  car_id         INT           NOT NULL,
  customer_id    INT           NOT NULL,
  start_date     DATE          NOT NULL,
  number_of_days INT           NOT NULL CHECK (number_of_days > 0),
  total_cost     DECIMAL(12,2) NOT NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_bookings_car
    FOREIGN KEY (car_id)      REFERENCES cars  (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_bookings_customer
    FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,


  INDEX idx_bookings_car_date (car_id, start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (name, email, password, role) VALUES
  ('Speedy Rentals',   'speedy@agency.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'AGENCY'),
  ('Metro Car Hire',   'metro@agency.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'AGENCY');


INSERT INTO users (name, email, password, role) VALUES
  ('Rahul Sharma',     'rahul@example.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'CUSTOMER'),
  ('Priya Mehta',      'priya@example.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'CUSTOMER');


INSERT INTO cars (agency_id, vehicle_model, vehicle_number, seating_capacity, rent_per_day) VALUES
  (1, 'Toyota Innova Crysta', 'MH01AB1234', 7, 3500.00),
  (1, 'Honda City',           'MH01CD5678', 5, 2000.00),
  (1, 'Maruti Swift',         'MH01EF9012', 5, 1200.00);


INSERT INTO cars (agency_id, vehicle_model, vehicle_number, seating_capacity, rent_per_day) VALUES
  (2, 'Hyundai Creta',        'DL01GH3456', 5, 2500.00),
  (2, 'Toyota Fortuner',      'DL01IJ7890', 7, 5000.00);
