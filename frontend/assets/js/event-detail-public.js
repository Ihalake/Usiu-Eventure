// frontend/assets/js/event-detail-public.js
document.addEventListener('DOMContentLoaded', function() {
    // Get event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (!eventId) {
        window.location.href = '/';
    }

    // Initialize
    fetchEventDetails(eventId);

    async function fetchEventDetails(id) {
        try {
            // Updated to use the main events endpoint
            const response = await fetch(`/api/events/${id}`);
            
            if (!response.ok) {
                throw new Error('Event not found');
            }
            
            const data = await response.json();
            const event = data.event;
            
            if (!event) {
                throw new Error('Event not found');
            }
            
            displayEventDetails(event);
            
            // Update page title
            document.title = `${event.title} - USIU Events`;
        } catch (error) {
            console.error('Error loading event details:', error);
            const eventDetailsContainer = document.getElementById('eventDetails');
            eventDetailsContainer.innerHTML = `
                <div class="p-12 text-center">
                    <h2 class="text-2xl font-bold text-[#1b0e19] mb-4">Event Not Found</h2>
                    <p class="text-[#964f8c]">The event you're looking for might have been removed or is no longer available.</p>
                </div>
            `;
        }
    }

    function displayEventDetails(event) {
        const eventDetailsContainer = document.getElementById('eventDetails');
        
        const formattedDate = formatDate(event.date);
        
        eventDetailsContainer.innerHTML = `
            <div class="h-64 md:h-96 bg-[#f3e8f1]">
                <img src="${event.imageUrl}" alt="${event.title}" class="w-full h-full object-cover">
            </div>
            <div class="p-8">
                <div class="flex flex-wrap gap-2 mb-4">
                    ${event.topics.map(topic => `
                        <span class="px-2 py-1 text-xs rounded-full bg-[#f3e8f1] text-[#92137f]">
                            ${topic}
                        </span>
                    `).join('')}
                </div>
                <h1 class="text-3xl font-bold text-[#1b0e19] mb-4">${event.title}</h1>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="md:col-span-2">
                        <div class="prose max-w-none mb-8">
                            ${formatDescription(event.description)}
                        </div>
                    </div>
                    
                    <div class="bg-[#fbf8fb] rounded-xl p-6">
                        <div class="mb-6">
                            <h3 class="text-lg font-medium text-[#1b0e19] mb-2">Date & Time</h3>
                            <p class="text-[#964f8c]">${formattedDate} at ${event.time}</p>
                        </div>
                        
                        <div class="mb-6">
                            <h3 class="text-lg font-medium text-[#1b0e19] mb-2">Location</h3>
                            <p class="text-[#964f8c]">${event.location}</p>
                        </div>
                        <div class="mb-6">
                            <h3 class="text-lg font-medium text-[#1b0e19] mb-2">Duration</h3>
                            <p class="text-[#964f8c]">${formatDuration(currentEvent.duration || 24)}</p>
                        </div>
                        <div>
                            <h3 class="text-lg font-medium text-[#1b0e19] mb-2">Status</h3>
                            <p class="inline-block px-3 py-1 rounded-full ${getStatusClass(event.status)}">
                                ${capitalizeFirstLetter(event.status)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Helper functions
    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function formatDuration(hours) {
        if (hours < 24) {
            return `${hours} hour${hours === 1 ? '' : 's'}`;
        } else {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            
            if (remainingHours === 0) {
                return `${days} day${days === 1 ? '' : 's'}`;
            } else {
                return `${days} day${days === 1 ? '' : 's'} and ${remainingHours} hour${remainingHours === 1 ? '' : 's'}`;
            }
        }
    }
    
    function formatDescription(description) {
        return description.replace(/\n/g, '<br>');
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function getStatusClass(status) {
        switch (status) {
            case 'upcoming':
                return 'bg-blue-100 text-blue-800';
            case 'ongoing':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-gray-100 text-gray-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }
});