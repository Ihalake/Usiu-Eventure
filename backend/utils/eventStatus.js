// backend/utils/eventStatus.js
function determineEventStatus(event) {
    const now = new Date();
    const eventDateTime = new Date(event.date);
    
    // Set event time from string "HH:MM" format
    if (event.time) {
      const [hours, minutes] = event.time.split(':').map(Number);
      eventDateTime.setHours(hours, minutes, 0, 0);
    }
    
    // Event end time using custom duration (default to 24 if not specified)
    const eventEndTime = new Date(eventDateTime);
    eventEndTime.setHours(eventEndTime.getHours() + (event.duration || 24));
    
    // If event is manually canceled, respect that status
    if (event.status === 'cancelled') {
      return 'cancelled';
    }
    
    // Determine status based on time
    if (now < eventDateTime) {
      return 'upcoming';
    } else if (now >= eventDateTime && now < eventEndTime) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  }
  
  module.exports = { determineEventStatus };