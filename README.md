# Travelo - Travel Planning Platform

A comprehensive travel planning application built with React and Node.js, enabling users to collaboratively plan trips, manage expenses, share itineraries, and more.

## 🌟 Features

### User Management
- **User Authentication**: Secure login and registration
- **Document Verification**: Upload NID/Passport for verification
- **User Profiles**: Manage personal information and settings

### Trip Management
- **Create & Edit Trips**: Organize trips with title, dates, description, and trip type
- **Trip Checklist**: Shared checklist with check/uncheck functionality
- **Member Management**: Invite/remove members from trips
- **Join Requests**: Handle trip join requests

### Communication
- **Real-time Group Chat**: Live messaging within trip groups using Socket.IO
- **In-app Notifications**: Get notified about expenses, itinerary changes, and messages

### Itinerary Planning
- **Day-by-day Activities**: Plan activities for each day of the trip
- **Activity Management**: Add, edit, and delete activities with simple fields

### Expense Management
- **Expense Logging**: Record expenses with amount, category, and payer
- **Automatic Split Calculation**: Fair expense splitting among trip members
- **Receipt Upload**: Upload and view expense receipts

### Destinations
- **Destination Explorer**: Browse curated destinations with descriptions
- **Map View**: View trip locations on an interactive map
- **Destination Details**: Explore destination information and images

### Media & Notes
- **Photo Gallery**: Upload and view trip photos
- **Personal Notes**: Create private or shared notes for trips
- **Packing Suggestions**: Get helpful packing recommendations

### Admin Features
- **Admin Dashboard**: Manage users and content
- **Verification Queue**: Approve/reject user document verifications
- **Reporting System**: Handle user reports and content moderation

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- UploadThing account (for file uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/roy032/Travelo.git
   cd Travelo
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure Environment Variables**

   **Server** (`server/.env`):
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   UPLOADTHING_TOKEN=your_uploadthing_token
   ```

   **Client** (already configured in `client/.env`):
   ```env
   VITE_API_URL=http://localhost:3000
   EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
   ```

5. **Seed Destinations (Optional)**
   ```bash
   cd server
   npm run seed:destinations
   ```

6. **Start the Development Servers**

   **Terminal 1 - Server:**
   ```bash
   cd server
   npm run dev
   ```

   **Terminal 2 - Client:**
   ```bash
   cd client
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 📁 Project Structure

```
Travelo/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── assets/        # Images and media
│   │   ├── components/    # React components
│   │   │   ├── admin/     # Admin components
│   │   │   ├── chat/      # Chat components
│   │   │   ├── features/  # Feature-specific components
│   │   │   ├── landing/   # Landing page components
│   │   │   ├── layout/    # Layout components
│   │   │   ├── shared/    # Shared components
│   │   │   └── ui/        # UI components
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
│
└── server/                # Node.js backend
    ├── src/
    │   ├── config/        # Configuration files
    │   ├── controllers/   # Route controllers
    │   ├── models/        # Mongoose models
    │   ├── routes/        # API routes
    │   ├── services/      # Business logic
    │   ├── middlewares/   # Express middlewares
    │   ├── socket/        # Socket.IO handlers
    │   ├── utils/         # Utility functions
    │   ├── validations/   # Input validations
    │   └── uploads/       # File upload storage
    └── package.json
```

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Socket.IO Client** - Real-time communication
- **React Leaflet** - Map integration
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - WebSocket server
- **JWT** - Authentication
- **UploadThing** - File uploads
- **Helmet** - Security
- **Bcrypt** - Password hashing

## 👥 Team Contributors

This project was collaboratively developed by three team members:

- **Jayanta** - User verification, trip management, checklist, chat, and notifications
- **Pallab** - Member management, destination explorer, map view, photos, and notes
- **Avrow** - Itinerary planner, expense tracking, split calculations, and admin features

## 📝 Available Scripts

### Server
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run seed:destinations` - Seed destination data

### Client
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Environment Variables

### Required Server Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `UPLOADTHING_TOKEN` - UploadThing API token

### Optional Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode
- `CLIENT_URL` - Frontend URL for CORS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🐛 Known Issues

- Duplicate schema index warnings in Mongoose (non-critical)
- Requires UploadThing account for file uploads

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Happy Traveling! ✈️🌍**
