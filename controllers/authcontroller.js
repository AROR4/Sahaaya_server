// authController.js
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return { payload: ticket.getPayload() };
  } catch (err) {
    console.error("Google token verification failed:", err.message);
    return { error: "Invalid Google token" };
  }
}

// ✅ Export verifyGoogleToken separately for mocking
exports.verifyGoogleToken = verifyGoogleToken;

exports.signup = async (req, res) => {
  const { credential } = req.body;
  const { payload, error } = await verifyGoogleToken(credential);

  if (error) return res.status(401).json({ message: error });

  try {
    let existingUser = await User.findOne({ email: payload.email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already registered' });
    }

    const newUser = new User({
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      authProvider: 'google',
    });

    await newUser.save();

    const token = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        picture: newUser.picture,
        role: newUser.role,
        isGovtIdVerified: newUser.isGovtIdVerified,
        token,
      },
    });

  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: 'Signup failed, please try again.' });
  }
};

exports.login = async (req, res) => {
  const { credential } = req.body;
  const { payload, error } = await verifyGoogleToken(credential);

  if (error) return res.status(401).json({ message: error });

  try {
    const existingUser = await User.findOne({ email: payload.email });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found, please sign up' });
    }

    const token = jwt.sign({ email: existingUser.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      user: {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        picture: existingUser.picture,
        role: existingUser.role,
        isGovtIdVerified: existingUser.isGovtIdVerified,
        token,
      },
    });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: 'Login failed, please try again.' });
  }
};

// Local email/password signup
exports.localSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.authProvider === 'google') {
        return res.status(400).json({ message: 'This email is already registered with Google. Please use Google sign in.' });
      }
      return res.status(400).json({ message: 'Email already registered. Please sign in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      authProvider: 'local',
      passwordHash,
    });

    res.status(201).json({
      message: 'Account created successfully! Please sign in to continue.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Local signup error:', err.message);
    res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
};

// Local email/password login
exports.localLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+passwordHash');
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: 'Account not found. Please sign up first.' });
    }
    
    // Check if user has password (local account)
    if (!user.passwordHash) {
      return res.status(401).json({ message: 'This email is registered with Google. Please use Google sign in.' });
    }

    // Verify password
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        isGovtIdVerified: user.isGovtIdVerified,
        token,
      },
    });
  } catch (err) {
    console.error('Local login error:', err.message);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// Token validation endpoint for app startup
exports.validateToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, message: 'No token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(401).json({ valid: false, message: 'User not found' });
    return res.status(200).json({ valid: true, user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      role: user.role,
      isGovtIdVerified: user.isGovtIdVerified,
    }});
  } catch (err) {
    return res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
};
