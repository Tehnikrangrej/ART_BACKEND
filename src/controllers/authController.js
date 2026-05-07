const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');
const generateToken = require('../utils/generateToken');
const generateOtp = require('../utils/generateOtp');
const sendEmail = require('../utils/sendEmail');
const otpTemplate = require('../utils/otpTemplate');
const asyncHandler = require('../utils/asyncHandler');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  parentId: user.parentId,
  isVerified: user.isVerified,
  twoFactorAuth: user.twoFactorAuth,
});

// ─── Register ─────────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public (first user → SUPERADMIN; subsequent → CLIENT by default)
//          SUPERADMIN can pass role='ADMIN' to create an admin account.
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, twoFactorAuth, role: requestedRole } = req.body;

  // ── Validation
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide both email and password.');
  }

  if (!EMAIL_REGEX.test(email)) {
    res.status(400);
    throw new Error('Invalid email format.');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long.');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists.');
  }

  // ── Determine role
  const userCount = await prisma.user.count();
  let assignedRole = 'CLIENT';

  if (userCount === 0) {
    // Bootstrap: very first user is always SUPERADMIN
    assignedRole = 'SUPERADMIN';
  } else if (requestedRole) {
    // Only SUPERADMIN may create ADMIN or SUPERADMIN accounts via this endpoint.
    // Check if request carries a valid bearer token for a SUPERADMIN user.
    // (Public registration always defaults to CLIENT unless caller is SUPERADMIN.)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const caller = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (caller && caller.role === 'SUPERADMIN' && ['ADMIN', 'SUPERADMIN'].includes(requestedRole)) {
          assignedRole = requestedRole;
        } else if (caller && caller.role === 'ADMIN' && requestedRole === 'ADMIN') {
          // ADMIN cannot create SUPERADMIN — silently fall back to CLIENT for invalid requests
          res.status(403);
          throw new Error('Admins cannot create SUPERADMIN accounts.');
        }
      } catch (jwtErr) {
        if (jwtErr.message.includes('Admins')) throw jwtErr;
        // Expired/invalid token → public registration → CLIENT role
      }
    }
  }

  // ── Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  const use2FA = twoFactorAuth !== undefined ? Boolean(twoFactorAuth) : true;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      twoFactorAuth: use2FA,
      // If 2FA is off, mark as verified immediately
      isVerified: use2FA === false,
    },
  });

  // ── Skip OTP if 2FA disabled
  if (!use2FA) {
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is ready.',
      data: {
        ...safeUser(user),
        token: generateToken(user.id),
      },
    });
  }

  // ── Send OTP
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await prisma.oTP.create({ data: { userId: user.id, otp, expiresAt } });
  console.log(`[DEV] Registration OTP for ${user.email}: ${otp}`);

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email — Art Portal',
      message: `Your registration OTP is: ${otp}`,
      html: otpTemplate(otp),
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
    res.status(500);
    throw new Error('Unable to send verification email. Please try again.');
  }

  res.status(201).json({
    success: true,
    message: 'Registration initiated. Please check your email for the OTP.',
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password.');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  if (!user.isVerified) {
    res.status(401);
    throw new Error('Email not verified. Please verify your email to continue.');
  }

  // ── Skip OTP if 2FA disabled
  if (!user.twoFactorAuth) {
    return res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        ...safeUser(user),
        token: generateToken(user.id),
      },
    });
  }

  // ── Send login OTP
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.oTP.create({ data: { userId: user.id, otp, expiresAt } });
  console.log(`[DEV] Login OTP for ${user.email}: ${otp}`);

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Login OTP — Art Portal',
      message: `Your login OTP is: ${otp}`,
      html: otpTemplate(otp),
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
    res.status(500);
    throw new Error('Unable to send login OTP. Please try again.');
  }

  res.json({
    success: true,
    message: 'OTP sent to your email. Please verify to complete login.',
  });
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required.');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404);
    throw new Error('No account found with this email.');
  }

  const validOtp = await prisma.oTP.findFirst({
    where: {
      userId: user.id,
      otp: String(otp),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!validOtp) {
    res.status(400);
    throw new Error('Invalid or expired OTP. Please request a new one.');
  }

  const wasAlreadyVerified = user.isVerified;

  // Mark verified & clean up OTPs
  await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
  await prisma.oTP.deleteMany({ where: { userId: user.id } });

  res.json({
    success: true,
    message: wasAlreadyVerified
      ? 'OTP verified. Logged in successfully.'
      : 'Email verified successfully. Your account is ready.',
    data: {
      ...safeUser({ ...user, isVerified: true }),
      token: generateToken(user.id),
    },
  });
});

// ─── Resend OTP ───────────────────────────────────────────────────────────────
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide your email address.');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404);
    throw new Error('No account found with this email.');
  }

  // Invalidate old OTPs
  await prisma.oTP.deleteMany({ where: { userId: user.id } });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.oTP.create({ data: { userId: user.id, otp, expiresAt } });
  console.log(`[DEV] Resent OTP for ${user.email}: ${otp}`);

  try {
    await sendEmail({
      email: user.email,
      subject: 'New OTP — Art Portal',
      message: `Your new OTP is: ${otp}`,
      html: otpTemplate(otp),
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
    res.status(500);
    throw new Error('Unable to send OTP. Please try again later.');
  }

  res.json({ success: true, message: 'A new OTP has been sent to your email.' });
});

// ─── Toggle 2FA ───────────────────────────────────────────────────────────────
// @route   PUT /api/auth/toggle-2fa
// @access  Private
const toggle2FA = asyncHandler(async (req, res) => {
  const { twoFactorAuth } = req.body;

  if (typeof twoFactorAuth !== 'boolean') {
    res.status(400);
    throw new Error('twoFactorAuth must be a boolean value.');
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: { twoFactorAuth },
  });

  res.json({
    success: true,
    message: `Two-Factor Authentication turned ${updated.twoFactorAuth ? 'ON' : 'OFF'}.`,
    data: { twoFactorAuth: updated.twoFactorAuth },
  });
});

// ─── Me ───────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

// ─── Get All Users ────────────────────────────────────────────────────────────
// @route   GET /api/auth/users
// @access  SUPERADMIN, ADMIN
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;

  const where = role ? { role } : {};
  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        parentId: true,
        isVerified: true,
        twoFactorAuth: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: users,
  });
});

// ─── Create Admin (SUPERADMIN only) ──────────────────────────────────────────
// @route   POST /api/auth/create-admin
// @access  SUPERADMIN
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password.');
  }

  if (!EMAIL_REGEX.test(email)) {
    res.status(400);
    throw new Error('Invalid email format.');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long.');
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(400);
    throw new Error('An account with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: false, // Now requires verification
      twoFactorAuth: true,
    },
  });

  // Generate OTP
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.oTP.create({
    data: { userId: admin.id, otp, expiresAt },
  });

  console.log(`[DEV] Admin Verification OTP for ${admin.email}: ${otp}`);

  // Send Verification Email
  try {
    await sendEmail({
      email: admin.email,
      subject: 'Your Admin Account Verification — Art Portal',
      message: `A new admin account has been created for you. Your verification OTP is: ${otp}`,
      html: otpTemplate(otp),
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
    // We don't throw here so the response still goes through, 
    // but the admin will need to request a resend later.
  }

  res.status(201).json({
    success: true,
    message: 'Admin account creation initiated. Please check your email for the OTP.',
  });
});

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  registerUser,
  loginUser,
  verifyOTP,
  resendOTP,
  toggle2FA,
  getMe,
  getAllUsers,
  createAdmin,
};
