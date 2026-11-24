require('dotenv').config();

const app = require('./app');
const pool = require('./config/database');

const PORT = process.env.PORT || 3000;
const DB_RETRY_INTERVAL_MS = 5000;

async function connectToDatabase() {
  while (true) {
    try {
      await pool.query('SELECT 1');
      console.log('MySQL connected successfully');
      return;
    } catch (error) {
      console.error(
        `Error connecting to MySQL: ${error.message}. Retrying in ${DB_RETRY_INTERVAL_MS / 1000} seconds.`
      );
      await new Promise((resolve) => setTimeout(resolve, DB_RETRY_INTERVAL_MS));
    }
  }
}

async function startServer() {
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`Agendaletric-2026 API running on port ${PORT}`);
  });
}

startServer();
