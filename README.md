# Blogging Platform

A full-stack blogging platform with user authentication, post creation, comments, and more. Built with Node.js/Express (backend) and React (frontend).

---

## Features

- User registration, login, and profile management
- Create, edit, and delete blog posts
- Drafts support for posts
- Commenting system
- Like posts and comments
- Media uploads for posts
- Featured posts carousel
- Search functionality
- Responsive, modern UI

---

## Project Structure

```
blogging-platform/
  backend/      # Node.js/Express API
  frontend/     # React app
```

---

## Prerequisites

- Node.js (v14+ recommended)
- npm
- MongoDB (local or cloud)
- Redis (for caching, optional but recommended)

---

## Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your MongoDB URI, JWT secret, etc.

3. **Start the backend server:**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

---

## Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend app:**
   ```bash
   npm start
   ```

3. The app will run at [http://localhost:3000](http://localhost:3000) by default.

---

## Environment Variables

- **Backend:**  
  See `backend/.env.example` for required variables (MongoDB URI, JWT secret, etc).
- **Frontend:**  
  You may need to set the API base URL in `frontend/src/services/api.js`.

---

## Scripts

- **Backend:**
  - `npm start` – Start server
  - `npm run dev` – Start server with nodemon
- **Frontend:**
  - `npm start` – Start React app

---

## Deployment

See `DEPLOYMENT.md` for deployment instructions.

---

## Troubleshooting

See `TROUBLESHOOTING.md` for common issues and solutions.

---

## Roadmap

See `FEATURES_ROADMAP.md` for planned features and improvements.

---

## License

[MIT](LICENSE) (or specify your license)

---

## Acknowledgements

- [Express](https://expressjs.com/)
- [React](https://reactjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)
- [Quill.js](https://quilljs.com/) (for rich text editing) 
