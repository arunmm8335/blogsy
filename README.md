# Blogsy: Your Space to Speak

**Blogsy** is a modern, full-stack MERN blogging platform designed for writers and readers to share ideas and connect with a vibrant community. Built with a professional tech stack including React, Node.js, Express, and MongoDB, this application is containerized with Docker and optimized with Redis for high performance.

---

## ✨ Features

### User & Authentication
-   **Secure JWT Authentication:** Stateful user sessions managed by secure, expiring JSON Web Tokens.
-   **Password Hashing:** User passwords are never stored in plain text, thanks to `bcrypt`.
-   **Full User Profiles:** Users can set their profile picture, bio, social media links, and other personal details.
-   **Password Reset Flow:** A complete, secure "Forgot Password" functionality that sends a unique reset link via email using **Nodemailer**.

### Content & Interaction
-   **Full CRUD for Posts:** Authenticated users can create, read, update, and delete their own posts.
-   **Rich Text Editor:** Utilizes **React Quill**, a powerful WYSIWYG editor, for creating beautifully formatted blog posts.
-   **Cloud-Based Media Uploads:** Seamless image and video uploads for posts and profiles, handled by **Cloudinary**.
-   **Dynamic Commenting System:** Users can comment on posts and reply to other comments in nested discussion threads.
-   **Post Likes:** Interactive "like" functionality on posts.

### UI & UX
-   **Responsive Design:** A beautiful and functional interface that works on all devices.
-   **Dark/Light Theme Toggle:** A persistent, context-based theme switcher.
-   **Live Search Suggestions:** An advanced search box with a debounced, live-updating suggestions dropdown.
-   **Dedicated Search Page:** A full search page with advanced filtering and sorting (by relevance, date, or likes).
-   **Professional UX Polish:**
    -   **Toast Notifications:** Non-intrusive feedback via **React Hot Toast**.
    -   **Skeleton Loaders:** Smooth loading states for content-heavy pages.
    -   **Page Transitions:** Elegant fade-in animations between pages using **Framer Motion**.
    -   **Reading Time & Progress Bar:** Blog posts display an estimated reading time and a scroll progress bar.

### Backend & Performance
-   **Redis Caching:** High-frequency read operations are cached with Redis to reduce database load and improve response times.
-   **API Rate Limiting:** Protects the backend from spam and brute-force attacks.
-   **SEO Optimized:** Dynamic page titles and meta descriptions are set on a per-page basis using `react-helmet-async`.

### Deployment
-   **Fully Containerized:** The entire stack (frontend, backend, database, cache) is orchestrated with **Docker and Docker Compose**.
-   **Production-Ready Builds:** Multi-stage Dockerfiles create small, optimized, and secure images, with the frontend served by **Nginx**.

---

## 🚀 Tech Stack

| Category          | Technology                                         |
|-------------------|----------------------------------------------------|
| **Frontend**      | React, React Router, Axios                         |
| **Backend**       | Node.js, Express.js                                |
| **Database**      | MongoDB (with Mongoose)                            |
| **Containerization**| Docker, Docker Compose, Nginx                      |
| **Caching**       | Redis                                              |
| **Authentication**| JSON Web Tokens (JWT), bcrypt                      |
| **File Uploads**  | Cloudinary, Multer                                 |
| **UI & Animation**| Framer Motion, React Hot Toast, React Loading Skeleton |
| **Email Service** | Nodemailer                                         |

---

## 📂 Project Structure

The project is organized into a monorepo structure with separate directories for the `backend` and `frontend`, and Docker configuration at the root level.

/blogging-platform
├── .env # Root environment variables for Docker Compose (sensitive)
├── .gitignore # Files and folders to be ignored by Git
├── docker-compose.yml # Orchestrates all Docker containers
├── README.md # You are here!
│
├── backend/
│ ├── .dockerignore # Files to ignore during the backend Docker build
│ ├── Dockerfile # Recipe for building the backend production image
│ ├── package.json # Backend dependencies and scripts
│ ├── server.js # The entry point for the Node.js server
│ ├── config/ # Database, Redis, and Cloudinary configuration
│ ├── controllers/ # Logic for handling API requests (MVC Controller)
│ ├── middleware/ # Custom middleware (auth, error handling, etc.)
│ ├── models/ # Mongoose schemas for the database (MVC Model)
│ └── routes/ # API route definitions (MVC View/Router)
│
└── frontend/
├── .dockerignore # Files to ignore during the frontend Docker build
├── Dockerfile # Recipe for building the frontend production image
├── nginx.conf # Nginx configuration for serving the React app
├── package.json # Frontend dependencies and scripts
├── public/ # Public assets and index.html
└── src/
├── App.js # Main application component with routing
├── index.js # The entry point for the React app
├── assets/ # Static assets like images and fonts
├── components/ # Reusable UI components (Header, PostItem, etc.)
├── context/ # React Context providers (Auth, Theme)
├── hooks/ # Custom React hooks (useDebounce)
├── pages/ # Page-level components (HomePage, PostPage, etc.)
└── services/ # API service functions (using Axios)


---

## 🏁 Getting Started

This guide will walk you through setting up and running the Blogsy application on your local machine using Docker.

### Prerequisites

Before you begin, ensure you have the following installed and configured:

1.  **[Docker Desktop](https://www.docker.com/products/docker-desktop/):** This is the **only essential software** needed to run the entire project. It includes Docker Engine and Docker Compose, which manage all application services.
2.  **[Git](https://git-scm.com/downloads):** Required to clone the repository.
3.  **[Cloudinary](https://cloudinary.com/users/register/free) Account:** Needed for image and video uploads. You'll need your `Cloud Name`, `API Key`, and `API Secret`.
4.  **Gmail Account with an App Password:** Required for the "Forgot Password" email feature. You must have 2-Step Verification enabled on your Google account to create one.

### Local Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/arunmm8335/blogsy.git
    cd blogsy
    ```

2.  **Create and Configure the Environment File:**
    In the root of the `blogsy` folder, create a new file named `.env`. Copy the contents from the `.env.example` section below into this file and fill in your actual secret keys.

3.  **Launch the Application with Docker Compose:**
    This is the **only command you need to run the entire project**. Make sure Docker Desktop is running, then execute from the root directory:
    ```bash
    docker-compose up --build
    ```
    *The `--build` flag builds the images. The first time will be slow; subsequent runs will be much faster. After the first successful build, you can just run `docker-compose up`.*

4.  **Access the Application:**
    Once the containers are running, open your web browser:
    -   **Frontend:** Navigate to **`http://localhost:3000`**

5.  **Stopping the Application:**
    To stop all running containers, go to the terminal where `docker-compose` is running and press **`Ctrl + C`**. To remove the containers completely, run `docker-compose down`.

---

## ⚙️ Environment Configuration (`.env.example`)

Create a `.env` file in the project's root directory and populate it with your keys.

```env
# A long, random, and secret string for signing JWTs
JWT_SECRET=your_super_secret_jwt_key_that_is_long_and_random

# Credentials for Nodemailer (use a 16-character Google App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your16charactergoogleappword

# Credentials for Cloudinary media storage
CLOUDINARY_CLOUD_NAME=your_cloud_name_from_dashboard
CLOUDINARY_API_KEY=your_api_key_from_dashboard
CLOUDINARY_API_SECRET=your_api_secret_from_dashboard
