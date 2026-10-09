const express = require('express');
const userController = require('./user.controller');
const { validateCreateUser } = require('./user.validator');
const router = express.Router();
router.post(
'/',
validateCreateUser,
userController.createUser
);
module.exports = router;