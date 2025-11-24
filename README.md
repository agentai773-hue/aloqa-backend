# AI Calling Agent Server

A Node.js Express server for the AI Calling Agent Admin Panel.

## Features

- Express.js web server
- CORS enabled for cross-origin requests
- Security headers with Helmet
- Request logging with Morgan
- Environment variable support
- API routing structure
- Error handling middleware
- Health check endpoint

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env` file and update with your actual values
   - Configure database connection if needed
   - Add API keys for external services

### Running the Server

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on port 5000 by default (or the PORT specified in your .env file).

## API Endpoints

### Base Endpoints
- `GET /` - Server welcome message
- `GET /health` - Health check endpoint

### API Routes
- `GET /api` - API information
- `GET /api/agents` - Get all agents (placeholder)
- `POST /api/agents` - Create new agent (placeholder)
- `GET /api/calls` - Get all calls (placeholder)
- `POST /api/calls` - Create new call (placeholder)
- `GET /api/analytics` - Get analytics data (placeholder)

## Project Structure

```
server/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env              # Environment variables (create from template)
├── .gitignore        # Git ignore rules
└── routes/
    └── api.js        # API route handlers
```

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
PORT=5000
NODE_ENV=development

# Add your database configuration
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=aicalling_agent

# Add your API keys
# AI_SERVICE_API_KEY=your_key_here
# TWILIO_ACCOUNT_SID=your_sid_here
```

## Development

The server is set up with basic middleware and route structure. You can extend it by:

1. Adding database integration (MongoDB, PostgreSQL, etc.)
2. Implementing authentication and authorization
3. Adding specific business logic for AI calling features
4. Integrating with external APIs (Twilio, OpenAI, etc.)
5. Adding data validation and sanitization

## Security Features

- Helmet for security headers
- CORS configuration
- Input validation (extend as needed)
- Environment variable protection

## Troubleshooting

1. **Port already in use**: Change the PORT in your `.env` file
2. **Dependencies issues**: Delete `node_modules` and run `npm install` again
3. **Permission errors**: Make sure you have proper file permissions

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include appropriate logging
4. Test your changes thoroughly# aloqa-backend
