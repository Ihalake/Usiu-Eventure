// backend/middleware/eventStatus.js
const { determineEventStatus } = require('../utils/eventStatus');

const updateEventStatus = async (req, res, next) => {
  // Skip if no events in the request
  if (!req.event && !req.events) {
    return next();
  }
  
  try {
    // For single event
    if (req.event) {
      const currentStatus = req.event.status;
      const calculatedStatus = determineEventStatus(req.event);
      
      // Only update if status has changed and not cancelled
      if (currentStatus !== calculatedStatus && currentStatus !== 'cancelled') {
        req.event.status = calculatedStatus;
        await req.event.save();
      }
    }
    
    // For multiple events
    if (req.events && Array.isArray(req.events)) {
      for (const event of req.events) {
        // Skip cancelled events
        if (event.status === 'cancelled') continue;
        
        const calculatedStatus = determineEventStatus(event);
        
        // Only update if status has changed
        if (event.status !== calculatedStatus) {
          event.status = calculatedStatus;
          await event.save();
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Error updating event status:', error);
    next();
  }
};

module.exports = { updateEventStatus };