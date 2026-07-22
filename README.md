# LinkForge

LinkForge is a full-stack URL shortener built with React and Express.js. It lets users turn long URLs into compact, shareable links and redirects visitors to the original destination.

## Features

- Create short links from long URLs
- Redirect short links to their original destinations
- Copy generated links to the clipboard
- Validate URLs and display useful error messages
- Responsive React interface
- REST API powered by Express.js

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js and Express.js
- **Database:** Add your database here (for example, MongoDB or PostgreSQL)

## Project Structure

```text
linkforge/
├── client/          # React frontend
├── server/          # Express backend
└── README.md
```

> Update this section if your frontend and backend use different directory names.

## Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) 18 or newer
- npm (included with Node.js)
- Your chosen database

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/linkforge.git
   cd linkforge
   ```

2. Install the backend dependencies:

   ```bash
   cd server
   npm install
   ```

3. Install the frontend dependencies:

   ```bash
   cd ../client
   npm install
   ```

## Environment Variables

Create a `.env` file inside the `server` directory:

```env
PORT=5000
DATABASE_URL=your_database_connection_string
CLIENT_URL=http://localhost:5173
BASE_URL=http://localhost:5000
```

If the React app needs an API URL, create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Never commit `.env` files or real credentials to version control.

## Running Locally

Start the Express server:

```bash
cd server
npm run dev
```

In another terminal, start the React app:

```bash
cd client
npm run dev
```

The frontend will typically be available at `http://localhost:5173`, and the API at `http://localhost:5000`.

## API Endpoints

The following is a suggested API contract. Update it to match your implementation.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/urls` | Create a shortened URL |
| `GET` | `/api/urls/:shortCode` | Get details for a short URL |
| `GET` | `/:shortCode` | Redirect to the original URL |

Example request:

```bash
curl -X POST http://localhost:5000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/a-very-long-url"}'
```

Example response:

```json
{
  "originalUrl": "https://example.com/a-very-long-url",
  "shortCode": "a1B2c3",
  "shortUrl": "http://localhost:5000/a1B2c3"
}
```

## Available Scripts

Run these commands from the relevant `client` or `server` directory, depending on how the project is configured:

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm test         # Run tests
npm start        # Start the production server
```

## Production Build

Build the React application with:

```bash
cd client
npm run build
```

Deploy the generated frontend build and Express API to your preferred hosting provider. Remember to set the production environment variables and configure CORS for the deployed frontend URL.

## Contributing

Contributions are welcome. Fork the repository, create a branch, make your changes, and open a pull request.

## License

This project is licensed under the MIT License. Add a `LICENSE` file to the repository if you plan to distribute it under these terms.
