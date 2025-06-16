# Blogsy: Your Space to Speak

 <!-- Optional: Add a screenshot of your app later -->

**Blogsy** is a modern, full-stack MERN blogging platform designed for writers and readers to share ideas and connect with a vibrant community. Built with a professional tech stack including React, Node.js, Express, and MongoDB, this application is containerized with Docker and optimized with Redis for high performance.

---

## ✨ Features

-   **Full CRUD Functionality:** Create, Read, Update, and Delete posts and comments.
-   **User Authentication:** Secure user registration and login using JWT (JSON Web Tokens).
-   **Rich Text Editor:** A "What You See Is What You Get" (WYSIWYG) editor for creating beautifully formatted blog posts.
-   **Media Uploads:** Seamlessly upload images and videos for posts and profile pictures, powered by Cloudinary.
-   **Advanced Search:** Powerful search functionality to find posts by title, content, tags, or author name.
-   **Interactive UI:** Like posts, reply to comments in nested threads, and view user profiles.
-e   **Professional Backend:** Rate limiting to prevent abuse, password reset functionality via email (Nodemailer), and Redis caching for high-performance reads.
-   **SEO Optimized:** Dynamic page titles and meta descriptions for better search engine visibility.
-   **Fully Containerized:** The entire application (frontend, backend, database, cache) is orchestrated with Docker and Docker Compose for consistent and scalable deployment.
-   **Responsive Design:** A beautiful and functional user interface that works on all devices.

---

## 🚀 Tech Stack

-   **Frontend:** React, React Router, Axios, Framer Motion (for animations)
-   **Backend:** Node.js, Express.js
-   **Database:** MongoDB with Mongoose
-   **Authentication:** JSON Web Tokens (JWT), bcrypt
-   **Caching:** Redis
-   **File Uploads:** Cloudinary, Multer
-   **Containerization:** Docker, Docker Compose
-   **Email Service:** Nodemailer

---

## 🏁 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18.x or later recommended)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
-   A `.env` file in the root directory with the necessary credentials (see `.env.example` below).

### Local Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/arunmm8335/blogsy.git
    cd blogsy
    ```

2.  **Create the root `.env` file:**
    Create a file named `.env` in the root of the project and add your credentials. Use the following as a template:

    ```env
    # .env

    # JWT Secret Key (use a long, random string)
    JWT_SECRET=your_super_secret_jwt_key

    # Nodemailer Credentials (for password reset)
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_16_character_google_app_password

    # Cloudinary Credentials
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

3.  **Run Local Dependencies (Optional, for IDE support):**
    For the best developer experience with tools like ESLint and Prettier in your IDE, run `npm install` in both the `backend` and `frontend` directories.
    ```bash
    # In one terminal
    cd backend && npm install

    # In another terminal
    cd frontend && npm install
    ```

4.  **Launch with Docker Compose:**
    From the root directory, run the following command. This will build the images and start all the containers (`frontend`, `backend`, `mongodb`, `redis`).
    ```bash
    docker-compose up --build
    ```

5.  **Access the Application:**
    -   Frontend (React App): **`http://localhost:3000`**
    -   Backend API: **`http://localhost:5000`**

---

## ⚙️ API Endpoints

A brief overview of the main API routes available:

| Method | Endpoint                    | Description                                  | Access   |
|--------|-----------------------------|----------------------------------------------|----------|
| `POST` | `/api/auth/register`        | Register a new user.                         | Public   |
| `POST` | `/api/auth/login`           | Authenticate a user and get a token.         | Public   |
| `POST` | `/api/auth/forgot-password` | Request a password reset email.              | Public   |
| `GET`  | `/api/posts`                | Get all posts with pagination.               | Public   |
| `POST` | `/api/posts`                | Create a new post.                           | Private  |
| `GET`  | `/api/posts/:id`            | Get a single post by its ID.                 | Public   |
| `PUT`  | `/api/posts/:id`            | Update a post.                               | Private  |
| `PUT`  | `/api/users/me`             | Update the logged-in user's profile.         | Private  |
| `GET`  | `/api/users/profile/:username` | Get a user's public profile and their posts. | Public   |

---

## 🌟 Acknowledgements

This project was a comprehensive learning journey into the MERN stack and modern web development practices. Thank you to everyone whose tutorials and documentation made this possible.
