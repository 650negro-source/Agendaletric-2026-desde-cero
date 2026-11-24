const express = require("express");
const { rateLimit } = require("express-rate-limit");
const authenticate = require("../../middlewares/auth.middleware");
const authController = require("./auth.controller");
const {
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
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
const recoveryRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message: "Too many password recovery requests. Try again in 15 minutes.",
    });
  },
});
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message: "Too many password reset attempts. Try again in 15 minutes.",
    });
  },
});

router.post(
  "/forgot-password",
  recoveryRequestLimiter,
  validateForgotPassword,
  authController.requestPasswordReset
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  validateResetPassword,
  authController.resetPassword
);

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
