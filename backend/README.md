# Bus Tracking Backend API

Real-time bus tracking and booking system backend built with Node.js, Express, PostgreSQL (Neon DB), and Socket.io.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- `DATABASE_URL`: Your Neon DB PostgreSQL connection string
- `JWT_SECRET`: A secure random string for JWT tokens
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key

### 3. Database Setup

Run the schema to create tables:

```bash
# Connect to your Neon DB and execute schema.sql
psql $DATABASE_URL -f schema.sql
```

Or use a database client to run the `schema.sql` file.

### 4. Start the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh` - Refresh JWT token
- `GET /me` - Get current user info

### Admin (`/api/admin`)
- `GET /users` - Get all users
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /trips` - Get all trips
- `GET /bookings` - Get all bookings
- `GET /analytics` - Dashboard analytics

### Driver (`/api/driver`)
- `POST /trips` - Create new trip
- `GET /trips/my` - Get driver's trips
- `PUT /trips/:id/start` - Start trip
- `PUT /trips/:id/complete` - Complete trip
- `POST /bookings/:id/verify` - Verify booking QR

### User (`/api/user`)
- `GET /trips/active` - Get active trips
- `GET /bookings/my` - Get user's bookings
- `GET /wallet` - Get wallet balance
- `GET /wallet/transactions` - Transaction history

### Trips (`/api/trips`)
- `GET /` - Get all active trips
- `GET /:id` - Get trip details
- `GET /:id/location` - Get current location

### Bookings (`/api/bookings`)
- `POST /` - Create booking
- `GET /:id` - Get booking details
- `GET /:id/qr` - Get QR code
- `DELETE /:id` - Cancel booking

### Wallet (`/api/wallet`)
- `POST /add-money` - Add money to wallet

## Socket.io Events

### From Driver:
- `driver:join-trip` - Join trip room
- `driver:location-update` - Send location update

### From User:
- `user:track-trip` - Subscribe to trip location
- `user:untrack-trip` - Unsubscribe from trip

### To Clients:
- `trip:location-updated` - Real-time location update
- `error` - Error message

## Default Admin Account

- Email: `admin@bustrack.com`
- Password: `admin123`

**Important**: Change this password after first login!
