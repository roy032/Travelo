# Destination Seeding Guide

This document explains how to seed the database with sample destination data.

## Overview

The destination seeding script populates the database with 12 curated travel destinations across different categories:
- Beach (Bali, Santorini)
- Mountain (Swiss Alps, Banff)
- City (Tokyo, Paris)
- Countryside (Tuscany, Cotswolds)
- Historical (Machu Picchu, Petra)
- Adventure (Queenstown, Patagonia)

## Running the Seeding Script

### Prerequisites
- MongoDB connection configured in `.env` file
- Node.js installed

### Steps

1. Navigate to the server directory:
```bash
cd server
```

2. Run the seeding script:
```bash
npm run seed:destinations
```

Or directly:
```bash
node seed-destinations.js
```

### What the Script Does

1. Connects to MongoDB using the `MONGODB_URI` from `.env`
2. Clears all existing destinations from the database
3. Inserts 12 sample destinations with:
   - Name and description
   - Category and country
   - Sample image paths
   - Highlights and best time to visit
4. Displays a summary of seeded destinations
5. Closes the database connection

### Output Example

```
Connected to MongoDB
Cleared existing destinations
Successfully seeded 12 destinations

Seeded destinations:
1. Bali, Indonesia (beach) - Indonesia
2. Swiss Alps, Switzerland (mountain) - Switzerland
3. Tokyo, Japan (city) - Japan
...

Database connection closed
```

## API Endpoints

After seeding, you can access destinations through these endpoints:

### Get All Destinations
```
GET /api/destinations
```

Optional query parameters:
- `category`: Filter by category (beach, mountain, city, countryside, historical, adventure)
- `search`: Search by name, description, or country

Examples:
- `/api/destinations` - Get all destinations
- `/api/destinations?category=beach` - Get only beach destinations
- `/api/destinations?search=japan` - Search for destinations related to Japan
- `/api/destinations?category=mountain&search=canada` - Combine filters

### Get Single Destination
```
GET /api/destinations/:destinationId
```

Example:
- `/api/destinations/507f1f77bcf86cd799439011` - Get specific destination by ID

## Notes

- The seeding script will **delete all existing destinations** before inserting new ones
- Image paths in the seed data are placeholders - you'll need to add actual images to your storage
- The script can be run multiple times safely
- No authentication is required to access destination endpoints (public data)
