const cron = require('node-cron');
const pdfMergeService = require('./pdfMergeService');

class MaintenanceService {
  start() {
    // Clean up old merge jobs every hour
    cron.schedule('0 * * * *', () => {
      console.log('🕐 Running maintenance: Cleaning up old merge jobs...');
      pdfMergeService.cleanupOldJobs(24); // Remove jobs older than 24 hours
    });

    console.log('✅ Maintenance service started');
  }
}

module.exports = new MaintenanceService();
