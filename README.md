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
-   **Dynamic Commenting System:** Users can comment on posts and reply to other comments in nested threads.
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

## 🏁 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18.x or later)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
-   A Git client.

### Local Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/arunmm8335/blogsy.git
    cd blogsy
    ```

2.  **Configure Environment Variables:**
    Create a file named `.env` in the root of the project. This file holds all your secret keys. Copy the contents of the `.env.example` section below into this new file and fill in your actual credentials.

3.  **Launch with Docker Compose:**
    From the root directory of the project, run the following command. This will build the production-ready images for all services and start the containers.
    ```bash
    docker-compose up --build
    ```
    *(The first build may take several minutes. Subsequent builds will be much faster.)*

4.  **Access the Application:**
    -   **Frontend:** Open your browser and navigate to **`http://localhost:3000`**
    -   **Backend API:** The API is accessible at `http://localhost:5000`

---

## ⚙️ Environment Configuration (`.env.example`)

Create a `.env` file in the project's root directory and add the following, replacing the placeholder values with your own keys.

```env
# A long, random, and secret string for signing JWTs
JWT_SECRET=your_super_secret_jwt_key_that_is_long_and_random

# Credentials for Nodemailer to send password reset emails
# For Gmail, this requires enabling 2-Step Verification and creating an App Password.
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your16charactergoogleappword

# Credentials for Cloudinary media storage
CLOUDINARY_CLOUD_NAME=your_cloud_name_from_dashboard
CLOUDINARY_API_KEY=your_api_key_from_dashboard
CLOUDINARY_API_SECRET=your_api_secret_from_dashboard
