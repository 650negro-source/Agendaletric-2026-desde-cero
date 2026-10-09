const userService = require('./user.service');
async function createUser(req, res, next) {
try {
const user = await userService.createUser(req.body);
return res.status(201).json({
message: 'User created successfully',
data: user
});
} catch (error) {
next(error);
}
}
module.exports = {
createUser
};