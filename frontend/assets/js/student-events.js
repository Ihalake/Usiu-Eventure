// frontend/assets/js/student-events.js
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    // Get user data
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = '/auth/login';
        return;
    }

    // Set user information
    document.getElementById('userInitials').textContent = user.initials || 'ST';
    document.getElementById('userName').textContent = user.firstName + ' ' + user.lastName;

    // Initialize
    let currentFilters = {
        period: '',
        topic: '',
        search: ''
    };

    // Set up event listeners
    document.getElementById('todayFilter').addEventListener('click', () => applyDateFilter('today'));
    document.getElementById('weekFilter').addEventListener('click', () => applyDateFilter('week'));
    document.getElementById('monthFilter').addEventListener('click', () => applyDateFilter('month'));
    document.getElementById('clearFilter').addEventListener('click', () => applyDateFilter(''));
    
    document.getElementById('topicFilter').addEventListener('change', function() {
        currentFilters.topic = this.value;
        fetchFilteredEvents();
    });

    let searchTimeout;
    document.getElementById('searchEvents').addEventListener('keyup', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = this.value;
            fetchFilteredEvents();
        }, 300);
    });

    // Initial events fetch
    fetchFilteredEvents();
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    function applyDateFilter(period) {
        // Update UI for active filter
        const filterButtons = ['todayFilter', 'weekFilter', 'monthFilter'];
        filterButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (id === period + 'Filter') {
                btn.classList.remove('bg-[#f3e8f1]', 'text-[#1b0e19]');
                btn.classList.add('bg-[#92137f]', 'text-white');
            } else {
                btn.classList.remove('bg-[#92137f]', 'text-white');
                btn.classList.add('bg-[#f3e8f1]', 'text-[#1b0e19]');
            }
        });

        // Show/hide clear button
        const clearBtn = document.getElementById('clearFilter');
        if (period) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }

        // Update filters and fetch
        currentFilters.period = period;
        fetchFilteredEvents();
    }

    async function fetchFilteredEvents() {
        try {
            // Show loading state
            document.getElementById('eventsList').innerHTML = `
                <div class="text-center py-8">
                    <div class="animate-spin inline-block w-8 h-8 border-4 border-[#e6d0e3] border-t-[#92137f] rounded-full"></div>
                    <p class="text-[#964f8c] mt-4">Loading events...</p>
                </div>
            `;
    
            // Build query string
            const params = new URLSearchParams();
            if (currentFilters.period) params.append('period', currentFilters.period);
            if (currentFilters.topic) params.append('topic', currentFilters.topic);
            if (currentFilters.search) params.append('search', currentFilters.search);
            
            
            const response = await fetch(`/api/student/events/filtered?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }

            const data = await response.json();
            
            // Update events list
            const eventsList = document.getElementById('eventsList');
            
            if (data.events && data.events.length > 0) {
                eventsList.innerHTML = data.events.map(event => `
                    <div class="flex items-center gap-4 bg-[#fbf8fb] px-4 min-h-[72px] py-2 justify-between rounded-xl">
                        <div class="flex items-center gap-4">
                            <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-14">
                                <img src="${event.imageUrl}" alt="${event.title}" class="w-full h-full object-cover rounded-lg">
                            </div>
                            <div class="flex flex-col justify-center">
                                <p class="text-[#1b0e19] text-base font-medium leading-normal line-clamp-1">${event.title}</p>
                                <p class="text-[#964f8c] text-sm font-normal leading-normal line-clamp-2">
                                    ${formatDate(event.date)} at ${event.time}
                                </p>
                            </div>
                        </div>
                        <div class="flex gap-4 items-center">
                            <button onclick="toggleBookmark('${event._id}')" 
                                    class="text-[#964f8c] hover:text-[#92137f]"
                                    title="${event.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" 
                                    class="${event.isBookmarked ? 'text-[#92137f]' : ''}" viewBox="0 0 256 256">
                                    <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.76,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z"></path>
                                </svg>
                            </button>
                            <a href="/student/event/${event._id}" 
                            class="text-[#92137f] hover:text-[#7b0f6b] font-medium">
                                View Details
                            </a>
                        </div>
                    </div>
                `).join('');
            } else {
                eventsList.innerHTML = `
                    <p class="text-center text-[#964f8c] py-8">No events found</p>
                `;
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            
            // More detailed error logging
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            
            document.getElementById('eventsList').innerHTML = `
                <div class="text-center py-8">
                    <p class="text-[#964f8c] text-lg">Error loading events</p>
                    <p class="text-[#964f8c] mt-2">Error details: ${error.message}</p>
                    <button onclick="fetchFilteredEvents()" class="mt-4 bg-[#92137f] text-white px-4 py-2 rounded-lg hover:bg-[#7b0f6b] transition-colors">
                        Try Again
                    </button>
                </div>
            `;
            
            showNotification('Failed to load events. Please try again later.', 'error');
        }
    }

    // Helper functions
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function showNotification(message, type = 'error') {
        const notification = document.getElementById('notification');
        const notificationContent = notification.querySelector('div');
        
        if (type === 'success') {
            notificationContent.className = 'mb-4 rounded-xl p-4 bg-[#f3f9f3] border border-[#92137f] text-[#1b0e19]';
        } else if (type === 'info') {
            notificationContent.className = 'mb-4 rounded-xl p-4 bg-[#f3f8fb] border border-[#92a7bf] text-[#1b0e19]';
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

// Make toggleBookmark available globally
window.toggleBookmark = async function(eventId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        // Find the bookmark icon for this event
        const bookmarkIcon = document.querySelector(`[onclick="toggleBookmark('${eventId}')"] svg`);
        
        // Show loading state
        if (bookmarkIcon) {
            bookmarkIcon.classList.add('animate-pulse');
        }
        
        const response = await fetch(`/api/student/events/${eventId}/bookmark`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Update UI to reflect bookmark status
            if (bookmarkIcon) {
                bookmarkIcon.classList.remove('animate-pulse');
                bookmarkIcon.classList.add('bookmark-animation');
                
                setTimeout(() => {
                    bookmarkIcon.classList.remove('bookmark-animation');
                }, 500);
                
                if (data.isBookmarked) {
                    // If bookmarked, make it purple
                    bookmarkIcon.classList.add('text-[#92137f]');
                } else {
                    // If not bookmarked, remove purple color
                    bookmarkIcon.classList.remove('text-[#92137f]');
                }
            }
            
            // Show toast notification
            showNotification(data.message, data.isBookmarked ? 'success' : 'info');
            
            // Update bookmark badge in sidebar
            if (typeof updateBookmarkBadge === 'function') {
                updateBookmarkBadge();
            }
        } else {
            throw new Error('Failed to toggle bookmark');
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        showNotification('Error updating bookmark', 'error');
        
        // Remove loading state
        if (bookmarkIcon) {
            bookmarkIcon.classList.remove('animate-pulse');
        }
    }
};

// Global function for bookmark toggle
async function toggleBookmark(eventId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        // Find the bookmark icon for this event
        const bookmarkIcon = document.querySelector(`[onclick="toggleBookmark('${eventId}')"] svg`);
        
        // Show loading state
        if (bookmarkIcon) {
            bookmarkIcon.classList.add('animate-pulse');
        }
        
        const response = await fetch(`/api/student/events/${eventId}/bookmark`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Update UI to reflect bookmark status
            if (bookmarkIcon) {
                bookmarkIcon.classList.remove('animate-pulse');
                bookmarkIcon.classList.add('bookmark-animation');
                
                setTimeout(() => {
                    bookmarkIcon.classList.remove('bookmark-animation');
                }, 500);
                
                if (data.isBookmarked) {
                    // If bookmarked, make it purple
                    bookmarkIcon.classList.add('text-[#92137f]');
                } else {
                    // If not bookmarked, remove purple color
                    bookmarkIcon.classList.remove('text-[#92137f]');
                }
            }
            
            // Show toast notification
            showNotification(data.message, data.isBookmarked ? 'success' : 'info');
        } else {
            throw new Error('Failed to toggle bookmark');
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        showNotification('Error updating bookmark', 'error');
        
        // Remove loading state
        if (bookmarkIcon) {
            bookmarkIcon.classList.remove('animate-pulse');
        }
    }
}