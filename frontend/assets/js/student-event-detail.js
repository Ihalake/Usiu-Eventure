// frontend/assets/js/student-event-detail.js
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

    // Get event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id') || window.location.pathname.split('/').pop();
    
    if (!eventId) {
        window.location.href = '/student/events';
        return;
    }

    // Initialize
    let currentEvent = null;
    fetchEventDetails(eventId);
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    // Add event listeners for buttons
    document.getElementById('bookmarkBtn').addEventListener('click', toggleBookmark);
    document.getElementById('volunteerBtn').addEventListener('click', showVolunteerForm);
    document.getElementById('cancelVolunteer').addEventListener('click', hideVolunteerForm);
    document.getElementById('volunteerSubmitForm').addEventListener('submit', submitVolunteerForm);

    async function fetchEventDetails(id) {
        try {
            const response = await fetch(`/api/events/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch event details');
            }

            const data = await response.json();
            currentEvent = data.event;
            
            // Update page title
            document.title = `${currentEvent.title} - USIU Events`;
            
            // Render event details
            renderEventDetails();
            
            // Also fetch user's relationship with this event
            fetchEventUserRelationship(id);
        } catch (error) {
            console.error('Error fetching event details:', error);
            showNotification('Failed to load event details. Please try again later.', 'error');
        }
    }

    async function fetchEventUserRelationship(eventId) {
        try {
            const response = await fetch(`/api/student/events/${eventId}/relationship`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch relationship data');
            }

            const data = await response.json();
            
            // Update UI based on relationship
            updateActionsPanel(data);
        } catch (error) {
            console.error('Error fetching relationship:', error);
        }
    }

    function renderEventDetails() {
        if (!currentEvent) return;

        const eventDetailsContainer = document.getElementById('eventDetails');
        
        eventDetailsContainer.innerHTML = `
            <div class="h-64 md:h-80 bg-[#f3e8f1]">
                <img src="${currentEvent.imageUrl}" alt="${currentEvent.title}" class="w-full h-full object-cover">
            </div>
            <div class="p-6">
                <div class="flex flex-wrap gap-2 mb-4">
                    ${currentEvent.topics.map(topic => `
                        <span class="px-2 py-1 text-xs rounded-full bg-[#f3e8f1] text-[#92137f]">
                            ${topic}
                        </span>
                    `).join('')}
                </div>
                <h1 class="text-2xl font-bold text-[#1b0e19] mb-2">${currentEvent.title}</h1>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                    <div class="md:col-span-2">
                        <div class="prose max-w-none mb-8">
                            ${formatDescription(currentEvent.description)}
                        </div>
                    </div>
                    
                    <div class="bg-[#fbf8fb] rounded-xl p-6">
                        <div class="mb-6">
                            <h3 class="text-lg font-medium text-[#1b0e19] mb-2">Date & Time</h3>
                            <p class="text-[#964f8c]">${formatDate(currentEvent.date)} at ${currentEvent.time}</p>
                        </div>
                        
                        <div class="mb-6">
                            <h3 class="text-lg font-medium text-[#1b0e19] mb-2">Location</h3>
                            <p class="text-[#964f8c]">${currentEvent.location}</p>
                        </div>
                        <div class="mb-6">
                        <h3 class="text-lg font-medium text-[#1b0e19] mb-2">Duration</h3>
                        <p class="text-[#964f8c]">${formatDuration(currentEvent.duration || 24)}</p>
                    </div>
                        <div>
                            <h3 class="text-lg font-medium text-[#1b0e19] mb-2">Status</h3>
                            <p class="inline-block px-3 py-1 rounded-full ${getStatusClass(currentEvent.status)}">
                                ${capitalizeFirstLetter(currentEvent.status)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Show actions panel
        document.getElementById('actionsPanel').classList.remove('hidden');
    }

    function displayEventStatus(event) {
        const now = new Date();
        const eventDate = new Date(event.date);
        const [hours, minutes] = event.time.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
        
        const eventEndDate = new Date(eventDate);
        eventEndDate.setHours(eventEndDate.getHours() + (event.duration || 24));
        
        let statusInfo = '';
        
        if (event.status === 'cancelled') {
            statusInfo = 'This event has been cancelled.';
        } else if (event.status === 'upcoming') {
            const timeUntil = formatTimeUntil(eventDate, now);
            statusInfo = `Starting in ${timeUntil}`;
        } else if (event.status === 'ongoing') {
            const timeLeft = formatTimeUntil(eventEndDate, now);
            statusInfo = `In progress. Ends in ${timeLeft}`;
        } else if (event.status === 'completed') {
            statusInfo = `This event has ended.`;
        }
        
        return `
            <div class="mb-4">
                <span class="inline-block px-3 py-1 rounded-full ${getStatusClass(event.status)} mb-1">
                    ${capitalizeFirstLetter(event.status)}
                </span>
                <p class="text-sm text-[#964f8c]">${statusInfo}</p>
            </div>
        `;
    }
    
    function formatTimeUntil(futureDate, now) {
        const diffMs = futureDate - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} and ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} and ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
        } else {
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
        }
    }

    function updateActionsPanel(relationshipData) {
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        const volunteerBtn = document.getElementById('volunteerBtn');
        
        // Update bookmark button
        if (relationshipData.isBookmarked) {
            bookmarkBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-[#92137f]" viewBox="0 0 256 256">
                    <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.76,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z"></path>
                </svg>
                <span>Bookmarked</span>
            `;
            bookmarkBtn.classList.remove('bg-[#f3e8f1]', 'text-[#92137f]');
            bookmarkBtn.classList.add('bg-[#92137f]', 'text-white');
        } else {
            bookmarkBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.76,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z"></path>
                </svg>
                <span>Bookmark</span>
            `;
            bookmarkBtn.classList.remove('bg-[#92137f]', 'text-white');
            bookmarkBtn.classList.add('bg-[#f3e8f1]', 'text-[#92137f]');
        }
        
        // Update volunteer button
        if (relationshipData.isVolunteering) {
            volunteerBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92Z"></path>
                </svg>
                <span>Volunteered (${relationshipData.volunteerRole})</span>
            `;
            volunteerBtn.disabled = true;
            volunteerBtn.classList.add('opacity-50', 'cursor-not-allowed');
            volunteerBtn.classList.remove('hover:bg-[#7b0f6b]');
        } else {
            volunteerBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92Z"></path>
                </svg>
                <span>Volunteer</span>
            `;
            volunteerBtn.disabled = false;
            volunteerBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            volunteerBtn.classList.add('hover:bg-[#7b0f6b]');
        }
    }

    async function toggleBookmark() {
        if (!currentEvent) return;
        
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        
        // Show loading state
        bookmarkBtn.disabled = true;
        bookmarkBtn.classList.add('opacity-75');
        
        try {
            const response = await fetch(`/api/student/events/${currentEvent._id}/bookmark`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error('Failed to toggle bookmark');
            }
    
            const data = await response.json();
            
            // Show notification
            showNotification(data.message, 'success');
            
            // Immediate UI update (optimistic)
            if (data.isBookmarked) {
                bookmarkBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-white" viewBox="0 0 256 256">
                        <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.76,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z"></path>
                    </svg>
                    <span>Bookmarked</span>
                `;
                bookmarkBtn.classList.remove('bg-[#f3e8f1]', 'text-[#92137f]');
                bookmarkBtn.classList.add('bg-[#92137f]', 'text-white');
            } else {
                bookmarkBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.76,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z"></path>
                    </svg>
                    <span>Bookmark</span>
                `;
                bookmarkBtn.classList.remove('bg-[#92137f]', 'text-white');
                bookmarkBtn.classList.add('bg-[#f3e8f1]', 'text-[#92137f]');
            }
            
            // Refresh relationship data
            fetchEventUserRelationship(currentEvent._id);
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            showNotification('Failed to update bookmark. Please try again.', 'error');
        } finally {
            // Remove loading state
            bookmarkBtn.disabled = false;
            bookmarkBtn.classList.remove('opacity-75');
        }
    }
    

    function showVolunteerForm() {
        document.getElementById('actionsPanel').classList.add('hidden');
        document.getElementById('volunteerForm').classList.remove('hidden');
    }

    function hideVolunteerForm() {
        document.getElementById('volunteerForm').classList.add('hidden');
        document.getElementById('actionsPanel').classList.remove('hidden');
    }

    async function submitVolunteerForm(e) {
        e.preventDefault();
        
        if (!currentEvent) return;
        
        const role = document.getElementById('volunteerRole').value;
        const note = e.target.elements.note.value;
        
        if (!role) {
            showNotification('Please select a role', 'error');
            return;
        }
        
        try {
            const response = await fetch(`/api/student/events/${currentEvent._id}/volunteer`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role, note })
            });

            if (!response.ok) {
                throw new Error('Failed to submit volunteer request');
            }

            const data = await response.json();
            
            // Show notification
            showNotification(data.message, 'success');
            
            // Hide form and show actions panel
            hideVolunteerForm();
            
            // Refresh relationship data
            fetchEventUserRelationship(currentEvent._id);
        } catch (error) {
            console.error('Error volunteering:', error);
            showNotification('Failed to submit volunteer request. Please try again.', 'error');
        }
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
        if (!description) return '';
        return description.replace(/\n/g, '<br>');
    }

    function capitalizeFirstLetter(string) {
        if (!string) return '';
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