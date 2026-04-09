# Blogging Platform

A Modern Full-Stack Blogging Platform

---

## Overview

This project is a robust, full-featured blogging platform designed for modern content creators and readers. It features a secure backend built with Node.js and Express, and a responsive, user-friendly frontend powered by React. The platform supports user authentication, post management, commenting, media uploads, and more, making it suitable for personal blogs, multi-author publications, or educational use.

---

## Features

- **User Authentication:** Secure registration, login, and profile management
- **Post Management:** Create, edit, delete, and draft blog posts
- **Commenting System:** Engage with posts through threaded comments
- **Likes:** Like posts and comments to show appreciation
- **Media Uploads:** Attach images and media to posts
- **Featured Posts:** Highlight selected posts in a carousel
- **Search Functionality:** Quickly find posts by keywords
- **Responsive Design:** Optimized for all devices
- **Performance:** Caching with Redis for improved speed (optional)
- **Event Streaming:** Kafka event publishing for async workflows (optional)

---

## Project Structure

```
blogging-platform/
  backend/      # Node.js/Express REST API
  frontend/     # React single-page application
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)
- [Supabase PostgreSQL](https://supabase.com/)
- [Redis](https://redis.io/) (optional, for caching)

---

## Getting Started

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```
2. **Environment Configuration**
   - Copy `.env.example` to `.env` and update the variables.
   - Set `DB_PROVIDER=supabase`.
   - Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   - Set `JWT_SECRET` for token signing.
3. **Start the Server**
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```
2. **Start the Application**
   ```bash
   npm start
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000) by default.

---

## Configuration

- **Backend:**
  - Refer to `backend/.env.example` for all required environment variables.
   - To enable Kafka events, set `KAFKA_ENABLED=true` and provide `KAFKA_BROKERS`.
- **Frontend:**
  - Ensure the API base URL is correctly set in `frontend/src/services/api.js` if you change backend ports or deploy separately.
   - For direct media upload (faster than backend multer relay), set in `frontend/.env`:
      - `REACT_APP_SUPABASE_URL`
      - `REACT_APP_SUPABASE_ANON_KEY`
      - `REACT_APP_SUPABASE_STORAGE_BUCKET` (default: `blogsy-media`)

Media upload strategy:
- If frontend Supabase env vars are configured, media uploads go directly to Supabase Storage and post APIs receive media URLs.
- If not configured, the app falls back to existing backend multer + Cloudinary upload flow.

---

## Available Scripts

### Backend
- `npm start` — Launches the production server
- `npm run dev` — Starts the server with hot-reloading (nodemon)
- `npm run worker:notifications` — Runs Kafka notifications consumer worker
- `npm run worker:analytics` — Runs Kafka analytics consumer worker

### Frontend
- `npm start` — Runs the React development server

---

## Migration Notes

Supabase migration and setup notes are available in `backend/SUPABASE_MIGRATION.md`.

---

## Kafka Events (Optional)

The backend emits Kafka events for:
- `user.registered`
- `user.logged_in`
- `post.created`

Default topics:
- Main topic: `blogsy.events`
- Dead-letter topic: `blogsy.events.dlt`

To run locally with Docker Compose:
1. `docker compose up -d kafka zookeeper`
2. Set `KAFKA_ENABLED=true` in `backend/.env`
3. Start backend: `cd backend && npm start`
4. Start worker: `cd backend && npm run worker:notifications`
5. Start analytics worker: `cd backend && npm run worker:analytics`

Analytics counters are tracked under cache keys like:
- `analytics:events:total`
- `analytics:events:type:<eventType>`
- `analytics:events:daily:<YYYY-MM-DD>:total`
- `analytics:events:daily:<YYYY-MM-DD>:type:<eventType>`

Analytics API endpoint:
- `GET /api/analytics/summary?date=YYYY-MM-DD` (requires auth token)

---

## License

This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this software as permitted under the license terms.

---

## Acknowledgements

- [Express](https://expressjs.com/) — Backend framework
- [React](https://reactjs.org/) — Frontend library
- [Supabase](https://supabase.com/) — Database platform
- [Redis](https://redis.io/) — Caching
- [Quill.js](https://quilljs.com/) — Rich text editor

---

For questions, suggestions, or contributions, please open an issue or submit a pull request. 

