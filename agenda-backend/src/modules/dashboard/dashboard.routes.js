const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");
const dashboardController = require("./dashboard.controller");

const router = express.Router();

router.use(authenticate);
router.get("/", authorizeRoles(1), dashboardController.getSummary);

module.exports = router;
