import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getDbProvider } from '../config/db.js';
import { getSupabaseClient } from '../config/supabase.js';
import { emitEvent } from '../services/kafkaService.js';

const ensureSupabaseMode = (next) => {
    if (getDbProvider() !== 'supabase') {
        const error = new Error('This backend is configured for Supabase only. Set DB_PROVIDER=supabase.');
        error.status = 500;
        next(error);
        return false;
    }

    return true;
};

const mapSupabaseUserToResponse = (user, token) => ({
    _id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio || '',
    profilePicture: user.profile_picture || '',
    socialLinks: user.social_links || {},
    token,
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
    const { username, email, password } = req.body;
    try {
        if (!ensureSupabaseMode(next)) return;

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();

            const { data: existingUser, error: existingError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (existingError) {
                throw existingError;
            }

            if (existingUser) {
                const error = new Error('User already exists');
                error.status = 400;
                return next(error);
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const { data: user, error: createError } = await supabase
                .from('users')
                .insert({
                    username,
                    email,
                    password_hash: passwordHash,
                    social_links: {}
                })
                .select('id, username, email, bio, profile_picture, social_links')
                .single();

            if (createError || !user) {
                const error = new Error('Invalid user data');
                error.status = 400;
                return next(error);
            }

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
            await emitEvent('user.registered', {
                userId: user.id,
                username: user.username,
                email: user.email
            });
            return res.status(201).json(mapSupabaseUserToResponse(user, token));
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
        if (!ensureSupabaseMode(next)) return;

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();

            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, username, email, bio, profile_picture, social_links, password_hash')
                .eq('email', email)
                .maybeSingle();

            if (userError) {
                throw userError;
            }

            if (user && (await bcrypt.compare(password, user.password_hash))) {
                const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
                await emitEvent('user.logged_in', {
                    userId: user.id,
                    username: user.username,
                    email: user.email
                });
                return res.json(mapSupabaseUserToResponse(user, token));
            }

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
        if (!ensureSupabaseMode(next)) return;

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, email')
                .eq('email', req.body.email)
                .maybeSingle();

            if (userError) {
                throw userError;
            }

            if (!user) {
                return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
            }

            const resetToken = crypto.randomBytes(20).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            const resetExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

            const { error: updateError } = await supabase
                .from('users')
                .update({
                    reset_password_token: hashedToken,
                    reset_password_expires: resetExpires
                })
                .eq('id', user.id);

            if (updateError) {
                throw updateError;
            }

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

            return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }
    } catch (error) {
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
        if (!ensureSupabaseMode(next)) return;

        if (getDbProvider() === 'supabase') {
            const supabase = getSupabaseClient();

            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('reset_password_token', resetPasswordToken)
                .gt('reset_password_expires', new Date().toISOString())
                .maybeSingle();

            if (userError) {
                throw userError;
            }

            if (!user) {
                const error = new Error('Password reset token is invalid or has expired.');
                error.status = 400;
                return next(error);
            }

            const passwordHash = await bcrypt.hash(req.body.password, 10);
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    password_hash: passwordHash,
                    reset_password_token: null,
                    reset_password_expires: null
                })
                .eq('id', user.id);

            if (updateError) {
                throw updateError;
            }

            return res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
        }
    } catch (error) {
        next(error);
    }
}; 
