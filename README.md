# Real-Time Bus Tracking & Booking System

A complete bus tracking and booking application with real-time location updates, flexible booking options, dynamic pricing, QR code verification, and e-wallet functionality.

## 🚀 Features

### Three User Roles

#### 👤 Passenger (User)
- Browse all active bus trips in real-time
- **Book from ANY stop to ANY stop** along the route
- View dynamically calculated prices based on distance
- Get QR code after booking
- Track bus location in real-time on map
- Manage e-wallet (add money, view balance, transaction history)
- View booking history

#### 🚗 Driver
- Create trips with start, end, and multiple stops
- Set base price for entire trip
- Start and complete trips
- Share real-time location during active trips (updates every 5 seconds)
- Scan passenger QR codes to verify bookings
- View only their own trip and booking data

#### 🔧 Admin
- Full access to all system data
- Manage users (Create, Read, Update, Delete)
- View all trips and bookings
- Dashboard with analytics
- Monitor the entire system

## 🏗️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API
- **PostgreSQL** (Neon DB) - Database
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Google Maps API** - Route calculation and distances

### Mobile App
- **React Native** (Expo) - Cross-platform mobile app
- **React Native Paper** - UI components (Material Design)
- **React Navigation** - App navigation
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates
- **Expo Location** - GPS location services
- **React Native Maps** - Map display
- **Expo Barcode Scanner** - QR code scanning
- **React Native QRCode SVG** - QR code generation

## 📁 Project Structure

```
bus-system/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/            # Database & Socket.io configuration
│   │   ├── middleware/        # Auth & role-based access control
│   │   ├── routes/            # API endpoints
│   │   ├── controllers/       # Business logic
│   │   ├── utils/             # Helper functions
│   │   └── server.js          # Express server entry point
│   ├── schema.sql             # Database schema
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── mobile/                     # React Native (Expo) app
│   ├── src/
│   │   ├── screens/           # App screens
│   │   ├── navigation/        # Navigation setup
│   │   ├── services/          # API, Socket.io, Location
│   │   ├── context/           # Auth context
│   │   └── utils/             # Constants
│   ├── App.js
│   ├── app.json
│   ├── package.json
│   └── README.md
└── README.md                   # This file
```

## 🔧 Setup Instructions

### Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL database** (Neon DB account)
- **Google Maps API key**
- **Expo CLI** (`npm install -g expo-cli`)

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure Environment
Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and add:
```env
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
PORT=3000
```

#### Setup Database
Run the schema to create tables:
```bash
# Using psql
psql $DATABASE_URL -f schema.sql

# Or connect to Neon DB console and run schema.sql
```

#### Start Backend Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

### 2. Mobile App Setup

#### Install Dependencies
```bash
cd mobile
npm install
```

#### Configure App
Edit `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_IP:3000",
      "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

**Important**: Replace `YOUR_IP` with your computer's local IP address (not `localhost`) so the mobile app can connect to the backend.

#### Start Mobile App
```bash
npm start

# Or specifically:
npm run android  # For Android
npm run ios      # For iOS
```

## 🗄️ Database Schema

### Tables

1. **users** - User accounts (admin, driver, user)
   - Authentication credentials
   - Role-based access
   - Wallet balance

2. **trips** - Bus trips created by drivers
   - Start/end locations
   - Multiple stops with cumulative distances
   - Route polyline from Google Maps
   - Base price and total distance
   - Current location (real-time)
   - Status (pending, active, completed, cancelled)

3. **bookings** - Passenger bookings
   - Trip reference
   - Pickup and dropoff stop indices
   - Calculated distance and price
   - Unique QR code
   - Status (pending, verified, completed, cancelled)

4. **wallet_transactions** - E-wallet transactions
   - Credit/debit transactions
   - Balance tracking
   - Booking references

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login
- `POST /refresh` - Refresh token
- `GET /me` - Get current user

### Admin Routes (`/api/admin`)
- `GET /users` - Get all users
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /trips` - Get all trips
- `GET /bookings` - Get all bookings
- `GET /analytics` - Dashboard analytics

### Driver Routes (`/api/driver`)
- `POST /trips` - Create trip
- `GET /trips/my` - Get driver's trips
- `PUT /trips/:id/start` - Start trip
- `PUT /trips/:id/complete` - Complete trip
- `POST /bookings/verify-qr` - Verify QR code

### User Routes (`/api/user`)
- `GET /trips/active` - Browse active trips
- `GET /bookings/my` - My bookings
- `GET /wallet` - Wallet balance
- `GET /wallet/transactions` - Transaction history

### Booking Routes (`/api/bookings`)
- `POST /` - Create booking
- `GET /:id` - Get booking details
- `GET /:id/qr` - Get QR code
- `DELETE /:id` - Cancel booking

### Wallet Routes (`/api/wallet`)
- `POST /add-money` - Add money

## 🔄 Real-Time Features (Socket.io)

### Events

**From Driver:**
- `driver:join-trip` - Join trip room when starting
- `driver:location-update` - Send location (every 5 seconds)

**From User:**
- `user:track-trip` - Subscribe to trip updates
- `user:untrack-trip` - Unsubscribe

**To Clients:**
- `trip:location-updated` - Broadcast driver location to all tracking users

## 💰 Dynamic Pricing Logic

The system calculates prices dynamically based on actual distance between selected stops:

```
Trip Example:
- Start (0 km) → Stop1 (5 km) → Stop2 (10 km) → End (15 km)
- Base Price: $30 for entire trip (15 km)
- Price per km: $30 / 15 km = $2/km

User books from Stop1 to Stop2:
- Distance: 10 km - 5 km = 5 km
- Price: 5 km × $2/km = $10
```

Each stop stores its cumulative distance from the start, calculated using Google Maps Directions API.

## 🎯 Key User Flows

### 1. Driver Creates Trip
1. Login as driver
2. Create new trip
3. Select start location on map
4. Add multiple stops by tapping map
5. Select end location
6. Set base price
7. System calculates route and distances using Google Maps
8. Trip created with status "pending"
9. Driver starts trip → status becomes "active"
10. Driver shares location in real-time via Socket.io
11. When done, driver completes trip

### 2. User Books Ticket
1. Login as user
2. Browse active trips
3. Select a trip
4. Choose pickup stop (start, or any intermediate stop)
5. Choose dropoff stop (any stop after pickup, or end)
6. System calculates distance and price
7. User confirms booking
8. System checks wallet balance
9. If sufficient, deduct amount and create booking
10. User receives unique QR code
11. Driver scans QR code to verify passenger

### 3. User Tracks Bus
1. User goes to "My Bookings"
2. Selects active booking
3. Taps "Track Bus"
4. App subscribes to trip location via Socket.io
5. Map shows bus moving in real-time
6. User sees route and their pickup/dropoff stops

## 🔐 Default Admin Account

**Email**: `admin@bustrack.com`
**Password**: `admin123`

⚠️ **Important**: Change this password after first login!

## 🧪 Testing

### Test Flow

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Mobile App**
   ```bash
   cd mobile
   npm start
   ```

3. **Create Test Accounts**
   - Register as Driver
   - Register as Passenger (User)
   - Login as Admin (use default credentials)

4. **Test Driver Flow**
   - Login as driver
   - Create a trip with multiple stops
   - Start the trip
   - Observe real-time location sharing

5. **Test User Flow**
   - Login as passenger
   - Add money to wallet
   - Browse active trips
   - Select trip and pickup/dropoff stops
   - Book ticket
   - View QR code
   - Track bus in real-time

6. **Test Admin Flow**
   - Login as admin
   - View all users, trips, and bookings
   - Check analytics dashboard

## 📋 Current Implementation Status

### ✅ Fully Implemented

**Backend:**
- ✅ Complete REST API with all endpoints
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Database schema and queries
- ✅ Socket.io real-time location
- ✅ Dynamic pricing engine
- ✅ QR code generation
- ✅ Wallet transactions
- ✅ Google Maps integration for routes

**Mobile:**
- ✅ Project structure and dependencies
- ✅ Authentication flow (Login/Register)
- ✅ AuthContext state management
- ✅ API service layer (all endpoints)
- ✅ Socket.io client service
- ✅ Location service
- ✅ Basic navigation structure

### ⏳ To Be Completed (Mobile Screens)

The backend is 100% complete. The mobile app foundation is ready, but the following screens need to be built:

- Admin: Dashboard, Manage Users, Manage Trips, Manage Bookings
- Driver: Create Trip, Active Trip (with location sharing), QR Scanner
- User: Browse Trips, Trip Details & Booking, My Bookings (with QR), Track Bus, Wallet

See `mobile/README.md` for detailed implementation guide with code examples.

## 🚀 Next Steps

1. **Complete Mobile Screens**: Implement the remaining screens listed above
2. **UI Polish**: Apply Material Design theming with React Native Paper
3. **Error Handling**: Add comprehensive error handling and loading states
4. **Testing**: End-to-end testing of all features
5. **Performance**: Optimize real-time updates and map rendering
6. **Deployment**: Deploy backend to production and publish mobile app

## 📖 Documentation

- **Backend API**: See `backend/README.md`
- **Mobile App**: See `mobile/README.md`
- **Implementation Plan**: See `.claude/plans/elegant-swinging-newt.md`

## 🤝 Contributing

This is a complete, production-ready backend with a mobile app foundation. To contribute:

1. Fork the repository
2. Create a feature branch
3. Implement features following the existing patterns
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC

## 👨‍💻 Support

For issues or questions:
1. Check the README files in backend and mobile folders
2. Review the implementation plan
3. Check API endpoints and their responses
4. Review Socket.io events documentation

---

**Built with ❤️ using React Native, Node.js, PostgreSQL, and Socket.io**
