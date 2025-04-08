// frontend/assets/js/student-bookmarks.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize common functionality
    if (!initCommon()) return;

    // Initialize
    fetchBookmarkedEvents();

    async function fetchBookmarkedEvents() {
        const token = localStorage.getItem('token');
        try {
            document.getElementById('bookmarkedEventsList').innerHTML = `
                <div class="text-center py-8">
                    <div class="animate-spin inline-block w-8 h-8 border-4 border-[#e6d0e3] border-t-[#92137f] rounded-full"></div>
                    <p class="text-[#964f8c] mt-4">Loading your bookmarked events...</p>
                </div>
            `;

            const response = await fetch('/api/student/bookmarks', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch bookmarked events');
            }

            const data = await response.json();

            // Empty state when no bookmarks exist
            if (!data.bookmarkedEvents || data.bookmarkedEvents.length === 0) {
                document.getElementById('bookmarkedEventsList').innerHTML = `
                    <div class="text-center p-8 bg-white rounded-xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mx-auto mb-4 text-[#92137f]" viewBox="0 0 256 256">
                            <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.76,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z"></path>
                        </svg>
                        <p class="text-[#964f8c] text-lg mb-4">No bookmarked events yet</p>
                        <p class="text-[#1b0e19] mb-6">When you bookmark events, they'll appear here for easy access.</p>
                        <a href="/student/events" class="bg-[#92137f] text-white px-6 py-3 rounded-xl hover:bg-[#7b0f6b] transition-colors inline-block">
                            Browse Events
                        </a>
                    </div>
                `;
            }
            
            if (data.bookmarkedEvents && data.bookmarkedEvents.length > 0) {
                document.getElementById('bookmarkedEventsList').innerHTML = data.bookmarkedEvents.map(event => `
                    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div class="flex md:flex-row flex-col">
                            <div class="md:w-1/4 w-full h-48 md:h-auto">
                                <img src="${event.imageUrl}" alt="${event.title}" class="w-full h-full object-cover">
                            </div>
                            <div class="p-6 md:w-3/4 w-full flex flex-col justify-between">
                                <div>
                                    <div class="flex flex-wrap gap-2 mb-3">
                                        ${event.topics.map(topic => `
                                            <span class="px-2 py-1 text-xs rounded-full bg-[#f3e8f1] text-[#92137f]">
                                                ${topic}
                                            </span>
                                        `).join('')}
                                    </div>
                                    <h3 class="text-xl font-bold text-[#1b0e19] mb-2">${event.title}</h3>
                                    <p class="text-[#964f8c] mb-4">${formatDate(event.date)} at ${event.time}</p>
                                    <p class="text-[#1b0e19] mb-6 line-clamp-2">${event.description}</p>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-[#1b0e19] text-sm">${event.location}</span>
                                    <div class="flex gap-3">
                                        <button onclick="removeBookmark('${event._id}')" class="text-red-500 hover:text-red-700 font-medium">
                                            Remove
                                        </button>
                                        <a href="/student/event/${event._id}" class="bg-[#92137f] text-white px-4 py-2 rounded-lg hover:bg-[#7b0f6b] transition-colors text-sm">
                                            View Details
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                document.getElementById('bookmarkedEventsList').innerHTML = `
                    <div class="text-center p-8 bg-white rounded-xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mx-auto mb-4 text-[#92137f]" viewBox="0 0 256 256">
                            <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.76,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z"></path>
                        </svg>
                        <p class="text-[#964f8c] text-lg mb-4">No bookmarked events yet</p>
                        <p class="text-[#1b0e19] mb-6">When you bookmark events, they'll appear here for easy access.</p>
                        <a href="/student/events" class="bg-[#92137f] text-white px-6 py-3 rounded-xl hover:bg-[#7b0f6b] transition-colors inline-block">
                            Explore Events
                        </a>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error fetching bookmarked events:', error);
            document.getElementById('bookmarkedEventsList').innerHTML = `
                <div class="text-center p-8 bg-white rounded-xl shadow-sm">
                    <p class="text-[#964f8c] text-lg mb-4">Error loading bookmarked events</p>
                    <button onclick="location.reload()" class="bg-[#92137f] text-white px-4 py-2 rounded-lg hover:bg-[#7b0f6b]">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    // Function to remove a bookmark
    window.removeBookmark = async function(eventId) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/student/events/${eventId}/bookmark`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                showNotification('Event removed from bookmarks', 'success');
                fetchBookmarkedEvents(); // Refresh the list
            } else {
                throw new Error('Failed to remove bookmark');
            }
        } catch (error) {
            console.error('Error removing bookmark:', error);
            showNotification('Error removing bookmark', 'error');
        }
    };

    // Helper functions
    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function showNotification(message, type = 'error') {
        const notification = document.getElementById('notification');
        const notificationContent = notification.querySelector('div');
        
        if (type === 'success') {
            notificationContent.className = 'mb-4 rounded-xl p-4 bg-[#f3f9f3] border border-[#92137f] text-[#1b0e19]';
        } else {
            notificationContent.className = 'mb-4 rounded-xl p-4 bg-[#fdf2f1] border border-[#e6d0e3] text-[#1b0e19]';
        }
        
        notificationContent.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
});