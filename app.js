// app.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");
const acknowledgementRoutes = require("./routes/acknowledgementRoutes");
const db = require("./db");

const app = express();
app.use(express.json());
const allowedOrigins = [
  "http://localhost:5173",
  "https://sahaayacampaigns.vercel.app",
  "https://sahaaya-zeta.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));


app.use("/api", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/user", userRoutes);
app.use("/api/", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/acknowledgements", acknowledgementRoutes);

module.exports = app;   // ✅ export only
