# Travel Planner Server

Backend server for the Travel Planner application built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Set at least the following variables (the server exits on startup if the first two are missing):
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A long random secret for signing JWTs
     - `UPLOADTHING_TOKEN`: UploadThing token (needed for uploads)
   - See the table under "Environment Variables" for optional settings

## MongoDB Setup

### Local MongoDB Installation

**Windows:**
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Default connection: `mongodb://localhost:27017/travel-planner`

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string and update `MONGODB_URI` in `.env`

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`)

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files (database, etc.)
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── service/         # Business logic
│   ├── utils/           # Utility functions
│   ├── validations/     # Input validation schemas
│   ├── app.js           # Express app configuration
│   ├── index.js         # Entry point
│   └── server.js        # Server initialization
├── uploads/             # File upload directories
│   ├── documents/       # User verification documents
│   ├── receipts/        # Expense receipts
│   └── photos/          # Trip photos
├── .env                 # Environment variables (not in git)
├── .gitignore          # Git ignore rules
└── package.json        # Dependencies and scripts
```

## Database Configuration

The database configuration includes:
- **Connection pooling**: Optimized for performance with min/max pool sizes
- **Error handling**: Comprehensive error logging and graceful shutdown
- **Event monitoring**: Connection status tracking
- **Automatic reconnection**: Handles connection drops

Configuration details in `src/config/database.js`:
- Max pool size: 10 connections
- Min pool size: 2 connections
- Socket timeout: 45 seconds
- Server selection timeout: 5 seconds

## File Upload Structure

New uploads (verification documents, receipts, photos) are stored on UploadThing. The `src/uploads/` directories only hold legacy local files; their contents are ignored by git, and `uploads/documents/` is never served publicly.

## API Endpoints

### Health Check
- `GET /` - Server status
- `GET /api` - API status

### Authentication
- `POST /api/auth/sign-up` - Register (rate limited)
- `POST /api/auth/sign-in` - Sign in (rate limited)
- `POST /api/auth/sign-out` - Sign out

Other route groups live in `src/routes/` (trips, activities, checklist, notes, expenses, photos, messages, notifications, invitations, destinations, profile, documents, admin).

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `MONGODB_URI` | MongoDB connection string | (required) |
| `JWT_SECRET` | Secret key for JWT tokens | (required) |
| `JWT_EXPIRES_IN` | JWT and auth cookie lifetime | 1d |
| `UPLOADTHING_TOKEN` | UploadThing API token | (required for uploads) |
| `CLIENT_URL` | Allowed client origin(s) for CORS and Socket.IO, comma-separated | http://localhost:5173 |
| `TRUST_PROXY` | Set to `true` behind a reverse proxy | false |

## Scripts

- `npm start` - Start the server
- `npm run dev` - Start with auto-reload (nodemon)
- `npm test` - Run tests (Vitest)
- `npm run seed:destinations` - Seed destination data
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Testing

Tests use Vitest (with fast-check and Supertest available):

```bash
npm test
```

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongoServerError: Authentication failed"**
- Check your MongoDB credentials in `.env`
- Ensure the database user has proper permissions

**Error: "MongooseServerSelectionError: connect ECONNREFUSED"**
- Ensure MongoDB is running
- Check the connection string in `.env`
- Verify firewall settings

**Error: "MongooseError: Operation buffering timed out"**
- MongoDB server is not responding
- Check network connectivity
- Increase `serverSelectionTimeoutMS` in database config

### Port Already in Use

If port 3000 is already in use:
1. Change the `PORT` in `.env` to another port (e.g., 3001)
2. Or stop the process using port 3000

## License

ISC
