import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import commentRoutes from './routes/commentRoutes.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON bodies

// --- THIS IS THE CRUCIAL FIX FOR IMAGES ---
// It makes the 'uploads' folder publicly accessible so the browser can load images.
const __dirname = path.resolve();
// This path assumes your 'uploads' folder is in the root of your project,
// next to your 'frontend' and 'backend' folders.
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
// --------------------------------------------


app.get('/', (req, res) => {
  res.send('Blogsy API is running...');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});