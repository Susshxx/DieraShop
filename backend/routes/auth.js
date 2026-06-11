import { Router } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { z } from 'zod';
import User from '../models/User.js';
import SignupOtp from '../models/SignupOtp.js';
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
    let afterLogin = '/account';
    try {
      const state = JSON.parse(Buffer.from(req.query.state || '', 'base64').toString());
      if (state.redirect) afterLogin = state.redirect;
    } catch {
      /* use default */
    }
    const url = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
    url.searchParams.set('token', token);
    url.searchParams.set('redirect', afterLogin);
    res.redirect(url.toString());
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

router.post('/logout', (_req, res) => {
  res.json({ ok: true });
});

export default router;
