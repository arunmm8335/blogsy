import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
    const { username, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            const error = new Error('User already exists');
            error.status = 400;
            return next(error);
        }
        const user = await User.create({ username, email, password });
        if (user) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                socialLinks: user.socialLinks,
                token,
            });
        } else {
            const error = new Error('Invalid user data');
            error.status = 400;
            return next(error);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                socialLinks: user.socialLinks,
                token,
            });
        } else {
            const error = new Error('Invalid email or password');
            error.status = 401;
            return next(error);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user's data
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    res.status(200).json(req.user);
};


// --- NEW FORGOT PASSWORD FUNCTION ---
// @desc    Request a password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        const message = `You are receiving this email because you (or someone else) requested a password reset. Please click this link to complete the process:\n\n${resetUrl}\n\nThis link will expire in 15 minutes. If you did not request this, please ignore this email.`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        await transporter.sendMail({
            to: user.email,
            from: `Blogsy Support <${process.env.EMAIL_USER}>`,
            subject: 'Password Reset Request',
            text: message,
        });

        res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (error) {
        // Clear token on error to allow user to retry
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
        }
        next(error);
    }
};

// --- NEW RESET PASSWORD FUNCTION ---
// @desc    Reset password using the token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            const error = new Error('Password reset token is invalid or has expired.');
            error.status = 400;
            return next(error);
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (error) {
        next(error);
    }
}; 
