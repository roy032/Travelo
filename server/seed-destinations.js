import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Destination from './src/models/destination.model.js';

// Load environment variables
dotenv.config();

// Sample destination data
const destinations = [
  {
    name: 'Bali, Indonesia',
    description: 'A tropical paradise known for its stunning beaches, lush rice terraces, ancient temples, and vibrant culture. Bali offers a perfect blend of relaxation, adventure, and spiritual experiences.',
    category: 'beach',
    country: 'Indonesia',
    images: [
      {
        filename: 'bali-beach.jpg',
        path: '/images/destinations/bali-beach.jpg',
        isFeatured: true,
      },
      {
        filename: 'bali-temple.jpg',
        path: '/images/destinations/bali-temple.jpg',
        isFeatured: false,
      },
    ],
    highlights: [
      'Beautiful beaches and surf spots',
      'Ancient temples like Tanah Lot and Uluwatu',
      'Ubud rice terraces',
      'Traditional Balinese dance performances',
      'World-class diving and snorkeling',
    ],
    bestTimeToVisit: 'April to October (dry season)',
  },
  {
    name: 'Swiss Alps, Switzerland',
    description: 'Majestic mountain ranges offering year-round outdoor activities, charming alpine villages, and breathtaking scenery. Perfect for skiing, hiking, and experiencing Swiss hospitality.',
    category: 'mountain',
    country: 'Switzerland',
    images: [
      {
        filename: 'swiss-alps.jpg',
        path: '/images/destinations/swiss-alps.jpg',
        isFeatured: true,
      },
    ],
    highlights: [
      'World-class skiing and snowboarding',
      'Scenic train rides like the Glacier Express',
      'Charming villages like Zermatt and Interlaken',
      'Hiking trails with stunning views',
      'Swiss chocolate and cheese',
    ],
    bestTimeToVisit: 'December to March (skiing), June to September (hiking)',
  },
  {
    name: 'Tokyo, Japan',
    description: 'A vibrant metropolis where ancient traditions meet cutting-edge technology. Experience incredible food, historic temples, modern architecture, and unique pop culture.',
    category: 'city',
    country: 'Japan',
    images: [
      {
        filename: 'tokyo-skyline.jpg',
        path: '/images/destinations/tokyo-skyline.jpg',
        isFeatured: true,
      },
      {
        filename: 'tokyo-temple.jpg',
        path: '/images/destinations/tokyo-temple.jpg',
        isFeatured: false,
      },
    ],
    highlights: [
      'Historic temples and shrines',
      'World-renowned cuisine and street food',
      'Shibuya Crossing and Shinjuku district',
      'Cherry blossom viewing in spring',
      'Modern technology and anime culture',
    ],
    bestTimeToVisit: 'March to May (cherry blossoms), September to November (fall colors)',
  },
  {
    name: 'Tuscany, Italy',
    description: 'Rolling hills covered with vineyards, medieval hilltop towns, Renaissance art, and world-class wine and cuisine. A perfect destination for culture, food, and relaxation.',
    category: 'countryside',
    country: 'Italy',
    images: [
      {
        filename: 'tuscany-hills.jpg',
        path: '/images/destinations/tuscany-hills.jpg',
        isFeatured: true,
      },
    ],
    highlights: [
      'Wine tasting in Chianti region',
      'Medieval towns like Siena and San Gimignano',
      'Renaissance art in Florence',
      'Authentic Italian cuisine',
      'Scenic countryside drives',
    ],
    bestTimeToVisit: 'April to June, September to October',
  },
  {
    name: 'Machu Picchu, Peru',
    description: 'Ancient Incan citadel set high in the Andes Mountains, offering a glimpse into pre-Columbian history and stunning mountain vistas. One of the New Seven Wonders of the World.',
    category: 'historical',
    country: 'Peru',
    images: [
      {
        filename: 'machu-picchu.jpg',
        path: '/images/destinations/machu-picchu.jpg',
        isFeatured: true,
      },
    ],
    highlights: [
      'Ancient Incan ruins and architecture',
      'Inca Trail hiking experience',
      'Breathtaking mountain scenery',
      'Sacred Valley exploration',
      'Rich Peruvian culture and cuisine',
    ],
    bestTimeToVisit: 'May to September (dry season)',
  },
  {
    name: 'Queenstown, New Zealand',
    description: 'Adventure capital of the world, surrounded by stunning mountains and crystal-clear lakes. Perfect for thrill-seekers and nature lovers alike.',
    category: 'adventure',
    country: 'New Zealand',
    images: [
      {
        filename: 'queenstown.jpg',
        path: '/images/destinations/queenstown.jpg',
        isFeatured: true,
      },
    ],
    highlights: [
      'Bungee jumping and skydiving',
      'Jet boating and white-water rafting',
      'Skiing and snowboarding in winter',
      'Milford Sound day trips',
      'Wine tasting in Central Otago',
    ],
    bestTimeToVisit: 'December to February (summer), June to August (skiing)',
  },
  {
    name: 'Santorini, Greece',
    description: 'Iconic Greek island famous for its white-washed buildings, blue-domed churches, and spectacular sunsets. A romantic destination with beautiful beaches and ancient ruins.',
    category: 'beach',
    country: 'Greece',
    images: [
      {
        filename: 'santorini.jpg',
        path: '/images/destinations/santorini.jpg',
        isFeatured: true,
      },
    ],
    highlights: [
      'Stunning sunset views in Oia',
      'Volcanic beaches with unique colors',
      'Ancient ruins of Akrotiri',
      'Traditional Greek cuisine and wine',
      'Charming villages perched on cliffs',
    ],
    bestTimeToVisit: 'April to November',
  },
  {
    name: 'Banff National Park, Canada',
    description: 'Pristine wilderness in the Canadian Rockies featuring turquoise lakes, towering peaks, and abundant wildlife. A paradise for outdoor enthusiasts.',
    category: 'mountain',
    country: 'Canada',
    images: [
      {
        filename: 'banff.jpg',
        path: '/images/destinations/banff.jpg',
        isFeatured: true,
      },
    ],
    highlights: [
      'Lake Louise and Moraine Lake',
      'Wildlife viewing (bears, elk, bighorn sheep)',
      'Hiking and mountain biking trails',
      'Hot springs and spa experiences',
      'Winter sports and ice skating',
    ],
    bestTimeToVisit: 'June to August (hiking), December to March (skiing)',
  },
  {
    name: 'Paris, France',
    description: 'The City of Light, renowned for its art, fashion, gastronomy, and culture. Home to iconic landmarks and world-class museums.',
    category: 'city',
    country: 'France',
    images: [
      {
        filename: 'paris.jpg',
        path: '/images/destinations/paris.jpg',
        isFeatured: true,
      },
    ],
    highlights: [
      'Eiffel Tower and Champs-Élysées',
      'Louvre Museum and Notre-Dame Cathedral',
      'Charming cafés and patisseries',
      'Seine River cruises',
      'Montmartre and Sacré-Cœur',
    ],
    bestTimeToVisit: 'April to June, September to October',
  },
  {
    name: 'Petra, Jordan',
    description: 'Ancient city carved into rose-red cliffs, showcasing remarkable Nabataean architecture. A UNESCO World Heritage Site and one of the New Seven Wonders.',
    category: 'historical',
    country: 'Jordan',
    images: [
      {
        filename: 'petra.jpg',
        path: '/images/destinations/petra.jpg',
        isFeatured: true,
      },
    ],
    highlights: [
      'The Treasury (Al-Khazneh)',
      'Monastery and Royal Tombs',
      'Siq canyon entrance',
      'Bedouin culture and hospitality',
      'Desert landscapes of Wadi Rum nearby',
    ],
    bestTimeToVisit: 'March to May, September to November',
  },
  {
    name: 'Cotswolds, England',
    description: 'Picturesque region of rolling hills, honey-colored stone villages, and quintessential English countryside. Perfect for a peaceful retreat.',
    category: 'countryside',
    country: 'United Kingdom',
    images: [
      {
        filename: 'cotswolds.jpg',
        path: '/images/destinations/cotswolds.jpg',
        isFeatured: true,
      },
    ],
    highlights: [
      'Charming villages like Bourton-on-the-Water',
      'Historic manor houses and gardens',
      'Traditional English pubs',
      'Scenic walking trails',
      'Antique shops and local markets',
    ],
    bestTimeToVisit: 'May to September',
  },
  {
    name: 'Patagonia, Argentina & Chile',
    description: 'Vast wilderness at the southern tip of South America, featuring dramatic mountains, glaciers, and pristine landscapes. A dream destination for adventurers.',
    category: 'adventure',
    country: 'Argentina/Chile',
    images: [
      {
        filename: 'patagonia.jpg',
        path: '/images/destinations/patagonia.jpg',
        isFeatured: true,
      },
    ],
    highlights: [
      'Torres del Paine National Park',
      'Perito Moreno Glacier',
      'Trekking and mountaineering',
      'Wildlife watching (penguins, guanacos)',
      'Remote and untouched landscapes',
    ],
    bestTimeToVisit: 'November to March (summer)',
  },
];

// Connect to MongoDB and seed data
const seedDestinations = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing destinations
    await Destination.deleteMany({});
    console.log('Cleared existing destinations');

    // Insert new destinations
    const result = await Destination.insertMany(destinations);
    console.log(`Successfully seeded ${result.length} destinations`);

    // Display seeded destinations
    console.log('\nSeeded destinations:');
    result.forEach((dest, index) => {
      console.log(`${index + 1}. ${dest.name} (${dest.category}) - ${dest.country}`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding destinations:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDestinations();
