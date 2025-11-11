# Poem API

A Node.js API for fetching poetry content with audio from the Poetry Foundation. This project scrapes poetry episodes and provides a RESTful API with caching, rate limiting, and browser pooling for efficient resource management.

## Features

- **Web Scraping**: Fetches Poem of the Day and Audio Poem of the Day from Poetry Foundation
- **Browser Pooling**: Efficient Puppeteer browser instance management
- **Caching**: In-memory caching with configurable TTL to reduce load
- **Rate Limiting**: Protects API from abuse (10 requests per minute by default)
- **Security**: Helmet.js for security headers, CORS enabled
- **Logging**: Structured logging with timestamps and log levels
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Health Checks**: `/health` endpoint for monitoring
- **Dockerized**: Ready for containerization with Alpine and Puppeteer images

## Project Structure

```
poem-api/
├── server.js                 # Main server entry point
├── src/
│   ├── config/
│   │   └── index.js         # Configuration management
│   ├── services/
│   │   └── poetryScraperService.js  # Web scraping logic
│   ├── routes/
│   │   └── poetry.js        # API routes
│   ├── middleware/
│   │   ├── errorHandler.js  # Error handling
│   │   └── requestLogger.js # Request logging
│   └── utils/
│       ├── browserPool.js   # Browser instance pool
│       ├── cache.js         # Caching utility
│       └── logger.js        # Logging utility
├── package.json
├── Dockerfile
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- Docker (optional, for containerization)

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/ornabmomin/poem-api.git
   cd poem-api
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file (optional):
   ```sh
   cp .env.example .env
   ```
   Edit `.env` to customize configuration.

### Running Locally

```sh
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

### Building and Running with Docker

```sh
# Build the Docker image (Alpine version)
docker build --target alpine -t poem-api:alpine .

# Or build with official Puppeteer image
docker build --target puppeteer -t poem-api:puppeteer .

# Run the container
docker run -p 3000:3000 poem-api:alpine
```

## API Endpoints

### Poetry Endpoints

- **GET `/api/poetry-episode`** - Fetch poetry episodes with audio

  - Returns an array of poetry episodes
  - Cached for 5 minutes by default
  - Rate limited to 10 requests per minute

- **POST `/api/cache/clear`** - Clear poetry cache

  - Useful for testing or forcing fresh data

- **GET `/api/cache/stats`** - Get cache statistics

  - Returns cache size, valid entries, and expired entries

- **GET `/api/pool/stats`** - Get browser pool statistics
  - Returns total browsers, available, and in-use counts

### Health Check

- **GET `/health`** - Health check endpoint
  - Returns server status, uptime, and browser pool statistics

## Configuration

All configuration is managed through environment variables. See `.env.example` for available options:

| Variable             | Default     | Description                           |
| -------------------- | ----------- | ------------------------------------- |
| `PORT`               | 3000        | Server port                           |
| `HOST`               | 0.0.0.0     | Server host                           |
| `NODE_ENV`           | development | Environment mode                      |
| `PUPPETEER_HEADLESS` | true        | Run browser in headless mode          |
| `PUPPETEER_TIMEOUT`  | 10000       | Page load timeout (ms)                |
| `BROWSER_POOL_MIN`   | 1           | Minimum browser instances             |
| `BROWSER_POOL_MAX`   | 3           | Maximum browser instances             |
| `CACHE_ENABLED`      | true        | Enable caching                        |
| `CACHE_TTL`          | 300000      | Cache TTL (ms) - 5 minutes            |
| `RATE_LIMIT_WINDOW`  | 60000       | Rate limit window (ms)                |
| `RATE_LIMIT_MAX`     | 10          | Max requests per window               |
| `LOG_LEVEL`          | info        | Logging level (error/warn/info/debug) |

## Development

### Running Tests

```sh
# Test the API locally
curl http://localhost:3000/health
curl http://localhost:3000/api/poetry-episode
```

### Logging Levels

Set `LOG_LEVEL` environment variable:

- `error`: Only errors
- `warn`: Warnings and errors
- `info`: General information (default)
- `debug`: Detailed debugging information

- `GET /poems/:id` - Get a specific poem

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
