# Poem API

A simple Node.js API for serving poems. This project provides endpoints to fetch, create, and manage poems.

## Features

- RESTful API for poems
- Dockerized for easy deployment
- GitHub Actions workflow for automated Docker builds and pushes

## Getting Started

### Prerequisites

- Node.js
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

### Running Locally

```sh
npm start
```

### Building and Running with Docker

```sh
# Build the Docker image
docker build -t poem-api .

# Run the container
docker run -p 3000:3000 poem-api
```

## API Endpoints

- `GET /poems` - List all poems
- `POST /poems` - Add a new poem
- `GET /poems/:id` - Get a specific poem

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
