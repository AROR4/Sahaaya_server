const express = require("express");
const router = express.Router();
const { signup, login, localSignup, localLogin, validateToken } = require("../controllers/authcontroller.js")


router.post("/signup", signup);
router.post("/login", login);
router.post("/local/signup", localSignup);
router.post("/local/login", localLogin);
router.get("/validate-token", validateToken);

module.exports = router;
