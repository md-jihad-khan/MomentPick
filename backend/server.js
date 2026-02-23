const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const photoRoutes = require('./routes/photos');
const { cleanupExpiredEvents } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/photos', photoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cron job: Run every hour to clean up expired events (older than 7 days)
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Running expired event cleanup...');
  try {
    await cleanupExpiredEvents();
    console.log('[CRON] Cleanup complete.');
  } catch (err) {
    console.error('[CRON] Cleanup error:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 MomentPick server running on port ${PORT}`);
});
