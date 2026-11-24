const express = require("express");
const { rateLimit } = require("express-rate-limit");
const authenticate = require("../../middlewares/auth.middleware");
const authController = require("./auth.controller");
const {
  validateLogin,
  validateChangePassword,
} = require("./auth.validator");

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message: "Too many login attempts. Try again in 15 minutes.",
    });
  },
});

router.post(
  "/login",
  loginLimiter,
  validateLogin,
  authController.login
);
router.patch(
  "/change-password",
  authenticate,
  validateChangePassword,
  authController.changePassword
);

module.exports = router;
