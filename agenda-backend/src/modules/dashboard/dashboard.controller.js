const dashboardService = require("./dashboard.service");

async function getSummary(_req, res, next) {
  try {
    const summary = await dashboardService.getSummary();
    return res.status(200).json({ data: summary });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
};
