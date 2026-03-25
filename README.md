# 🚗 DriveEase — Car Rental System

A full-stack car rental web application with role-based access for **Customers** and **Car Rental Agencies**.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | HTML, CSS, Vanilla JavaScript     |
| Backend  | Node.js + Express.js              |
| Auth     | JWT (jsonwebtoken) + bcrypt       |
| Database | MySQL                             |

---

## Project Structure

```
car-rental/
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js      # Register + Login logic
│   │   ├── carController.js       # Add, Edit, Get cars
│   │   └── bookingController.js   # Rent car + Agency bookings
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verify + role guard
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── carRoutes.js
│   │   └── bookingRoutes.js
│   ├── app.js                     # Express entry point
│   ├── package.json
│   └── .env.example               # Environment variable template
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── api.js                 # Shared fetch wrapper + auth helpers
│   ├── index.html                 # Available Cars (public)
│   ├── login.html
│   ├── register.html
│   ├── add-car.html               # Agency only
│   ├── edit-car.html              # Agency only
│   └── dashboard.html             # Agency only
├── database.sql                   # Schema + seed data
└── README.md
```

---

## Setup & Installation

### Prerequisites
- Node.js v16+
- MySQL 8.0+

---

### Step 1 — Database

```bash
# Log into MySQL and run the schema
mysql -u root -p < database.sql
```

This creates the `car_rental_db` database with all tables and sample data.

---

### Step 2 — Backend

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
```

Edit `.env` and fill in your values:

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=car_rental_db
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
```

Start the server:

```bash
# Production
npm start

# Development (auto-restart)
npm run dev
```

The API will be available at `http://localhost:3000`.

---

### Step 3 — Frontend

The frontend is plain HTML/CSS/JS — no build step needed.

The Express backend already serves it at `http://localhost:3000`.

Simply open your browser at:

```
http://localhost:3000
```

---

## Sample Login Credentials

All sample users have the password: **`password123`**

| Role     | Email                 | Password    |
|----------|-----------------------|-------------|
| Agency   | speedy@agency.com     | password123 |
| Agency   | metro@agency.com      | password123 |
| Customer | rahul@example.com     | password123 |
| Customer | priya@example.com     | password123 |

---

## API Endpoints

### Authentication
| Method | Endpoint            | Access | Description         |
|--------|---------------------|--------|---------------------|
| POST   | /api/auth/register  | Public | Register new user   |
| POST   | /api/auth/login     | Public | Login, returns JWT  |

### Cars
| Method | Endpoint       | Access   | Description                    |
|--------|----------------|----------|--------------------------------|
| GET    | /api/cars      | Public   | Get all available cars         |
| GET    | /api/cars/:id  | Agency   | Get single car (edit pre-fill) |
| POST   | /api/cars      | Agency   | Add a new car                  |
| PUT    | /api/cars/:id  | Agency   | Edit own car                   |

### Bookings
| Method | Endpoint              | Access   | Description                     |
|--------|-----------------------|----------|---------------------------------|
| POST   | /api/bookings         | Customer | Rent a car                      |
| GET    | /api/bookings/agency  | Agency   | View all bookings for own cars  |

---

## Role-Based Access Rules

| Feature              | Customer | Agency |
|----------------------|----------|--------|
| View available cars  | ✅       | ✅     |
| Rent a car           | ✅       | ❌     |
| Add cars             | ❌       | ✅     |
| Edit cars            | ❌       | ✅     |
| View booked cars     | ❌       | ✅     |

---

## Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- **JWT** tokens signed with a secret key; expire in 7 days
- Role checks on every protected API route via middleware
- Agencies can only edit **their own** cars (ownership check in DB query)
- Double-booking prevention via **overlap query** in MySQL

---

## Validation Rules

- Email must be unique across all users
- Vehicle number must be unique
- Number of days must be > 0
- Start date cannot be in the past
- Rent per day must be > 0
- Seating capacity must be > 0
- Overlapping bookings for the same car are rejected
