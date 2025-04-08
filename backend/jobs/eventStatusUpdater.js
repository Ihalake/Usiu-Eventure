// Create new file: backend/jobs/eventStatusUpdater.js
const cron = require('node-cron');
const Event = require('../models/Event');
const { determineEventStatus } = require('../utils/eventStatus');

// Schedule job to run every hour
function startEventStatusUpdater() {
  // Run job every hour at the 0th minute
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running event status update job');
      
      // Get all events that are not cancelled
      const events = await Event.find({ status: { $ne: 'cancelled' } });
      
      let updatedCount = 0;
      
      // Update each event status if needed
      for (const event of events) {
        const calculatedStatus = determineEventStatus(event);
        
        if (event.status !== calculatedStatus) {
          event.status = calculatedStatus;
          await event.save();
          updatedCount++;
        }
      }
      
      console.log(`Event status update complete: ${updatedCount} events updated`);
    } catch (error) {
      console.error('Error in event status update job:', error);
    }
  });
  
  console.log('Event status updater scheduled');
}

module.exports = { startEventStatusUpdater };