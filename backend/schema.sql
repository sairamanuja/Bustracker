-- Bus Tracking & Booking System Database Schema

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (Admin, Driver, User)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'driver', 'user')),
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Trips table
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  start_location JSONB NOT NULL,  -- {lat, lng, address}
  end_location JSONB NOT NULL,    -- {lat, lng, address}
  stops JSONB NOT NULL,           -- Array of {lat, lng, address, distance_from_start}
  route_polyline TEXT,            -- Encoded polyline from Google Maps
  base_price DECIMAL(10, 2) NOT NULL,
  total_distance DECIMAL(10, 2),  -- In kilometers
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  current_location JSONB,         -- {lat, lng, timestamp} - updated in real-time
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for trips table
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);

-- Bookings table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  pickup_stop_index INTEGER NOT NULL,   -- Index in trips.stops array
  dropoff_stop_index INTEGER NOT NULL,  -- Index in trips.stops array
  pickup_location JSONB NOT NULL,       -- Actual location details
  dropoff_location JSONB NOT NULL,      -- Actual location details
  distance DECIMAL(10, 2) NOT NULL,     -- Distance between pickup and dropoff
  price DECIMAL(10, 2) NOT NULL,        -- Calculated based on distance
  qr_code TEXT UNIQUE NOT NULL,         -- Unique QR code for verification
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'completed', 'cancelled')),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for bookings table
CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_qr ON bookings(qr_code);

-- Wallet transactions table
CREATE TABLE wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for wallet_transactions table
CREATE INDEX idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_created ON wallet_transactions(created_at);

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' with bcrypt
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@bustrack.com', '$2b$10$rKZf8qhJqKZf8qhJqKZf8eO5KVqJQVQJQVQJQVQJQVQJQVQJQVQJa', 'System Admin', 'admin');

-- Note: The above password hash is a placeholder. When setting up, you should generate a proper hash.
-- You can generate it using: bcrypt.hash('admin123', 10)
