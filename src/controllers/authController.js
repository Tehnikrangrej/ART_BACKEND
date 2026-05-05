const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');
const generateToken = require('../utils/generateToken');
const generateOtp = require('../utils/generateOtp');
const sendEmail = require('../utils/sendEmail');
const otpTemplate = require('../utils/otpTemplate');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// @desc    Register a new user & Send OTP
// @route   POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, twoFactorAuth } = req.body;

  // Validation
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide both email and password.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Invalid email format.');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters.');
  }

  const userExists = await prisma.user.findUnique({ where: { email } });

  if (userExists) {
    res.status(400);
    throw new Error('An account with this email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const userCount = await prisma.user.count();
  const roleName = userCount === 0 ? 'ADMINISTRATOR' : 'CLIENT';

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: {
        connectOrCreate: {
          where: { name: roleName },
          create: { name: roleName }
        }
      },
      twoFactorAuth: twoFactorAuth !== undefined ? twoFactorAuth : true,
      isVerified: twoFactorAuth === false ? true : false,
    },
  });


  if (user.twoFactorAuth === false) {
    return res.status(201).json({
      success: true,
      message: 'Email verified successfully. Your account is ready.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      },
    });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.oTP.create({
    data: { userId: user.id, otp, expiresAt },
  });

  console.log(`[TESTING] Registration OTP for ${user.email}: ${otp}`);

  try {
    await sendEmail({
      email: user.email,
      subject: 'Email Verification OTP',
      message: `Your OTP for registration is: ${otp}`,
      html: otpTemplate(otp),
    });
    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
    });
  } catch (err) {
    console.error('Email sending failed:', err.message);
    res.status(500);
    throw new Error('Unable to send verification email. Please try again later.');
  }
});

// @desc    Login user & Send OTP
// @route   POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, twoFactorAuth } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && (await bcrypt.compare(password, user.password))) {
    if (user.isVerified === false) {
      res.status(401);
      throw new Error('Email not verified. Please verify your email to continue.');
    }

    const shouldSendOTP = twoFactorAuth !== undefined ? twoFactorAuth : user.twoFactorAuth;

    if (shouldSendOTP === false) {
      return res.json({
        success: true,
        message: 'Logged in successfully.',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          token: generateToken(user.id),
        },
      });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.oTP.create({
      data: { userId: user.id, otp, expiresAt },
    });

    console.log(`[TESTING] Login OTP for ${user.email}: ${otp}`);

    try {
      await sendEmail({
        email: user.email,
        subject: 'Login OTP',
        message: `Your OTP for login is: ${otp}`,
        html: otpTemplate(otp),
      });
      res.json({
        success: true,
        message: 'OTP sent to your email. Please verify to login.',
      });
    } catch (err) {
      console.error('Email sending failed:', err.message);
      res.status(500);
      throw new Error('Unable to send login OTP. Please try again later.');
    }
  } else {
    res.status(401);
    throw new Error('Invalid email or password. Please check your credentials and try again.');
  }
});

// @desc    Verify OTP for Register/Login
// @route   POST /api/auth/verify-otp
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { otps: true }
  });

  if (!user) {
    res.status(404);
    throw new Error('Account not found with the provided email.');
  }

  const foundOtp = await prisma.oTP.findFirst({
    where: {
      userId: user.id,
      otp: otp,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!foundOtp) {
    res.status(400);
    throw new Error('Invalid OTP. Please try again.');
  }

  // Mark user as verified
  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
  });

  // Delete used OTPs to keep DB clean
  await prisma.oTP.deleteMany({
    where: { userId: user.id }
  });

  // Decide success message based on user state
  const isNewlyVerified = user.isVerified === false;

  res.json({
    success: true,
    message: isNewlyVerified
      ? 'Email verified successfully. Your account is ready.'
      : 'OTP verified successfully. Logged in successfully.',
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user.id),
    },
  });
});

// @desc    Toggle 2FA setting
// @route   PUT /api/auth/toggle-2fa
const toggle2FA = asyncHandler(async (req, res) => {
  const { twoFactorAuth } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { twoFactorAuth },
  });

  res.json({
    success: true,
    message: `Two-Factor Authentication turned ${updatedUser.twoFactorAuth ? 'ON' : 'OFF'}`,
    data: {
      twoFactorAuth: updatedUser.twoFactorAuth
    }
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address.');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(404);
    throw new Error('Account not found with the provided email.');
  }

  // Delete any existing OTPs for this user (effectively "expiring" them)
  await prisma.oTP.deleteMany({
    where: { userId: user.id }
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  await prisma.oTP.create({
    data: { userId: user.id, otp, expiresAt },
  });

  console.log(`[TESTING] Resent OTP for ${user.email}: ${otp}`);

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your New Verification OTP',
      message: `Your new OTP code is: ${otp}`,
      html: otpTemplate(otp),
    });

    res.json({
      success: true,
      message: 'A new OTP has been sent to your email.',
    });
  } catch (err) {
    console.error('Email sending failed:', err.message);
    res.status(500);
    throw new Error('Unable to send the new OTP. Please try again later.');
  }
});

// @desc    Check if user is logged in
// @route   GET /api/auth/am-i-login
const amILogin = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});



// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: users
  });
});

module.exports = {
  registerUser,
  loginUser,
  verifyOTP,
  toggle2FA,
  resendOTP,
  amILogin,
  getAllUsers,
};

