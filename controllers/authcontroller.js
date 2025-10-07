// authController.js
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
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
    });

    await newUser.save();

    const token = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

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

    const token = jwt.sign({ email: existingUser.email }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

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
