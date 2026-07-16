import { Router } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { z } from 'zod';
import crypto from 'crypto';
import User from '../models/User.js';
import SignupOtp from '../models/SignupOtp.js';
import PasswordReset from '../models/PasswordReset.js';
import { signToken } from '../utils/jwt.js';
import { generateOtp, hashOtp, compareOtp } from '../utils/otp.js';
import { sendEmail, otpEmailHtml } from '../utils/email.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

const googleOAuthEnabled =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

if (googleOAuthEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'));
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              user.name = user.name || profile.displayName;
              user.avatarUrl = user.avatarUrl || profile.photos?.[0]?.value || '';
              await user.save();
            } else {
              user = await User.create({
                googleId: profile.id,
                email,
                name: profile.displayName || '',
                avatarUrl: profile.photos?.[0]?.value || '',
                role: 'user',
              });
            }
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

router.get('/google', (req, res, next) => {
  if (!googleOAuthEnabled) {
    return res.status(503).json({ error: 'Google OAuth not configured' });
  }
  const redirect = req.query.redirect || `${process.env.FRONTEND_URL}/account`;
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: Buffer.from(JSON.stringify({ redirect })).toString('base64'),
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleOAuthEnabled) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/login?error=google`);
  }
  next();
}, passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=google` }), (req, res) => {
    const token = signToken(req.user);
    const user = {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    };
    
    let afterLogin = '/account';
    try {
      const state = JSON.parse(Buffer.from(req.query.state || '', 'base64').toString());
      if (state.redirect) afterLogin = state.redirect;
    } catch {
      /* use default */
    }
    
    // Create a one-time auth code that can be exchanged for the token
    const authCode = Buffer.from(JSON.stringify({ token, user, redirect: afterLogin })).toString('base64');
    
    // Redirect with auth code (short-lived, one-time use)
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?code=${authCode}`);
  });

router.post('/send-otp', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      fullName: z.string().min(2).max(80),
      password: z.string().min(8).max(128),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const { email, fullName, password } = parsed.data;
    console.log('[send-otp] Processing OTP request for:', email);
    
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const code = generateOtp();
    const codeHash = await hashOtp(code);
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await SignupOtp.create({ email: email.toLowerCase(), codeHash, fullName, passwordHash, expiresAt });
    console.log('[send-otp] OTP record created in database');

    console.log('[send-otp] Attempting to send email...');
    const mailResult = await sendEmail({
      to: email,
      subject: 'Your Diera Shop Verification Code',
      html: otpEmailHtml(code),
      otpCode: code,
    });

    console.log('[send-otp] Mail result:', mailResult);

    res.json({
      ok: true,
      message: mailResult.stub
        ? 'OTP generated — check the backend terminal for the code (email not configured)'
        : 'OTP sent to your email',
      devOtpLogged: Boolean(mailResult.stub),
      emailSentSuccessfully: !mailResult.stub,
    });
  } catch (err) {
    console.error('send-otp error:', err);
    console.error('send-otp error stack:', err.stack);
    res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
});

console.log(SignupOtp);

router.post('/verify-otp', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const { email, code } = parsed.data;
  const otp = await SignupOtp.findOne({ email: email.toLowerCase(), consumedAt: null }).sort({ createdAt: -1 });
  if (!otp) return res.status(400).json({ error: 'No OTP found. Request a new one.' });
  if (otp.expiresAt < new Date()) return res.status(400).json({ error: 'OTP expired' });
  if (otp.attempts >= 5) return res.status(429).json({ error: 'Too many attempts' });

  const valid = await compareOtp(code, otp.codeHash);
  if (!valid) {
    otp.attempts += 1;
    await otp.save();
    return res.status(400).json({ error: 'Invalid code' });
  }

  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash: otp.passwordHash,
    name: otp.fullName || '',
    role: 'user',
  });

  otp.consumedAt = new Date();
  await otp.save();

  const token = signToken(user);
  res.json({
    token,
    user: { id: user._id, email: user.email, name: user.name, role: user.role },
  });
});

router.post('/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials' });

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user?.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user._id, email: user.email, name: user.name, role: user.role },
  });
});

router.post('/admin/signup', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    adminSignupCode: z.string(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  if (parsed.data.adminSignupCode !== process.env.ADMIN_SIGNUP_CODE) {
    return res.status(403).json({ error: 'Invalid admin signup code' });
  }

  const existing = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await User.create({
    email: parsed.data.email.toLowerCase(),
    passwordHash,
    name: parsed.data.fullName,
    role: 'admin',
  });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user._id, email: user.email, name: user.name, role: user.role },
  });
});

router.get('/me', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
  });
});

// New endpoint to get auth from cookie (for Google OAuth)
router.get('/cookie-auth', async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'No auth cookie found' });
    }
    
    // Verify the token
    const { verifyToken: verifyTokenFn } = await import('../utils/jwt.js');
    const decoded = verifyTokenFn(token);
    
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Cookie auth error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token');
  res.clearCookie('auth_redirect');
  res.json({ ok: true });
});

// Password Reset: Request reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid email' });

    const { email } = parsed.data;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await PasswordReset.create({
      email: email.toLowerCase(),
      tokenHash,
      expiresAt,
    });

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}?email=${encodeURIComponent(email)}`;

    // Send email with reset link
    const resetEmailHtml = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fdf2f4;border-radius:12px;">
        <h2 style="color:#9d174d;">Diera Shop — Password Reset</h2>
        <p>Hi there,</p>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${resetLink}" style="display:inline-block;padding:12px 32px;background:#be185d;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
        </div>
        <p style="color:#666;font-size:14px;">This link will expire in 1 hour.</p>
        <p style="color:#666;font-size:14px;">If you didn't request this, please ignore this email.</p>
        <p style="color:#999;font-size:12px;margin-top:30px;">Or copy and paste this link: ${resetLink}</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: 'Reset Your Diera Shop Password',
      html: resetEmailHtml,
      templateParams: {
        reset_link: resetLink,
        user_name: user.name || 'there',
        to_name: user.name || email.split('@')[0],
      },
      templateId: process.env.EMAILJS_TEMPLATE_ID_RESET, // Use separate template for password reset
    });

    res.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('forgot-password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Password Reset: Verify token and reset password
router.post('/reset-password', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      token: z.string().min(32),
      newPassword: z.string().min(8).max(128),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

    const { email, token, newPassword } = parsed.data;

    // Find the most recent unused reset token
    const resetRecord = await PasswordReset.findOne({
      email: email.toLowerCase(),
      consumedAt: null,
    }).sort({ createdAt: -1 });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    if (resetRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Reset link has expired' });
    }

    if (resetRecord.attempts >= 5) {
      return res.status(429).json({ error: 'Too many attempts. Please request a new reset link.' });
    }

    // Verify token
    const valid = await bcrypt.compare(token, resetRecord.tokenHash);
    if (!valid) {
      resetRecord.attempts += 1;
      await resetRecord.save();
      return res.status(400).json({ error: 'Invalid reset link' });
    }

    // Update user password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Mark token as consumed
    resetRecord.consumedAt = new Date();
    await resetRecord.save();

    res.json({ ok: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
