# Missouri Crossroads - Interactive Historical Map

A Next.js application that displays an interactive map of Missouri's historical locations, including museums, libraries, and other significant sites. Built with AWS services for data storage and authentication.

## 🗺️ Features

- **Interactive Map**: Google Maps integration showing 1000+ Missouri historical locations
- **Location Categories**: Museums, Libraries, Educational Institutions, and more
- **Search & Filter**: Find locations by name, address, tags, or categories
- **Location-based Loading**: Optimized loading based on user's current location
- **InfoWindow Details**: Click pins to view detailed information about each location
- **AWS Integration**: S3 for data storage, DynamoDB for user management, Cognito for authentication
- **Data Management**: Admin dashboard for editing and re-uploading location data

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- AWS Account with S3, DynamoDB, and Cognito services
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd missouri-crossroads
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```bash
   # AWS Configuration (Public - Safe for client-side)
   NEXT_PUBLIC_AWS_REGION=us-east-2
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_user_pool_id
   NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id
   NEXT_PUBLIC_DYNAMODB_USERS_TABLE=missouri-crossroads-users
   NEXT_PUBLIC_DYNAMODB_NOTES_TABLE=missouri-crossroads-notes
   NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE=missouri-crossroads-admin-logs
   
   # AWS Secrets (Server-side ONLY - NEVER use NEXT_PUBLIC_ prefix!)
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   S3_BUCKET_NAME=mr-crossroads-bucket
   COGNITO_CLIENT_SECRET=your_client_secret
   
   # Google Maps API (Public - These keys are restricted by domain)
   NEXT_PUBLIC_MAP_KEY=your_google_maps_api_key
   NEXT_PUBLIC_PLACES_KEY=your_google_places_api_key
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── admin/             # Admin operations
│   │   ├── auth/              # Authentication
│   │   ├── database/          # Database operations
│   │   └── map/               # Map data API
│   ├── components/            # React components
│   │   └── MissouriMap.tsx    # Main map component
│   ├── lib/                   # Utilities and services
│   │   ├── config/            # AWS configuration
│   │   ├── models/            # Data models
│   │   └── utils/             # Utility functions
│   └── map/                   # Map page
├── components/ui/              # UI components (shadcn/ui)
├── public/                     # Static assets
└── types/                      # TypeScript type definitions
```

## 🗄️ Database Schema

### DynamoDB Tables

#### Users Table (`missouri-crossroads-users`)
```json
{
  "id": "user-1234567890-abc123def",
  "email": "user@example.com",
  "name": "John Doe",
  "preferredUsername": "johndoe",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-01T12:00:00.000Z",
  "isActive": true,
  "role": "user"
}
```

#### Notes Table (`missouri-crossroads-notes`)
```json
{
  "id": "note-1234567890-abc123def",
  "title": "My Note",
  "bodyText": "This is my note content",
  "creator": "user-1234567890-abc123def",
  "creatorEmail": "user@example.com",
  "type": "note",
  "media": ["https://s3.../image1.jpg"],
  "audio": ["https://s3.../audio1.mp3"],
  "latitude": 39.0997,
  "longitude": -94.5786,
  "published": true,
  "tags": ["important", "work"],
  "time": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Testing
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage

# Linting & Formatting
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm format           # Format code with Prettier

# Database
pnpm db:setup         # Set up DynamoDB tables
pnpm db:seed          # Seed database with sample data
```

### Adding New Locations

1. **Via Admin Dashboard**: Use the admin interface to add/edit locations
2. **Via CSV Upload**: Upload a CSV file with location data
3. **Via API**: Use the REST API endpoints to programmatically add locations

### API Endpoints

#### Map Data
- `GET /api/map/csv-data` - Get location data for the map
- `POST /api/admin/upload-csv` - Upload new CSV data

#### Database Operations
- `GET /api/database/users` - Get all users
- `POST /api/database/users` - Create new user
- `GET /api/database/notes` - Get all notes
- `POST /api/database/notes` - Create new note

#### Admin Operations
- `GET /api/admin/stats` - Get admin statistics
- `POST /api/admin/bulk-notes` - Bulk update/delete notes
- `GET /api/admin/logs` - Get admin activity logs

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test MissouriMap.test.tsx

# Run tests with coverage
pnpm test:coverage
```

### Test Structure

```
├── __tests__/
│   ├── components/           # Component tests
│   ├── api/                 # API route tests
│   ├── utils/               # Utility function tests
│   └── integration/         # Integration tests
```

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**
   - Set all environment variables in your deployment platform
   - Ensure AWS credentials have proper permissions
   - Configure Google Maps API key for production domain

2. **AWS Resources**
   - S3 bucket for file storage
   - DynamoDB tables for data persistence
   - Cognito User Pool for authentication

### Deploy to Vercel

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Deploy to AWS

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Deploy using AWS Amplify or similar service**

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   pnpm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. **Check the [Issues](https://github.com/your-org/missouri-crossroads/issues) page**
2. **Create a new issue** with detailed information
3. **Join our community discussions**

## 🙏 Acknowledgments

- Missouri Historical Society for location data
- Google Maps Platform for mapping services
- AWS for cloud infrastructure
- Next.js team for the amazing framework

---

**Built with ❤️ for Missouri's historical heritage**