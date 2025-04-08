// frontend/assets/js/event-detail.js
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
    }

    // Get event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (!eventId) {
        window.location.href = '/admin/events';
    }

    // Initialize
    fetchEventDetails(eventId);
    setAdminInitials();

    // Set edit button URL
    document.getElementById('editEventBtn').href = `/admin/edit-event?id=${eventId}`;

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    async function fetchEventDetails(id) {
        try {
            const response = await fetch(`/api/events/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Event not found');
            }
            
            const data = await response.json();
            const event = data.event;
            
            if (!event) {
                throw new Error('Event not found');
            }
            
            displayEventDetails(event);
        } catch (error) {
            showNotification('Error loading event details');
            setTimeout(() => {
                window.location.href = '/admin/events';
            }, 2000);
        }
    }

    function displayEventDetails(event) {
        const eventDetailsContainer = document.getElementById('eventDetails');
        
        const formattedDate = formatDate(event.date);
        
        eventDetailsContainer.innerHTML = `
            <div class="flex flex-col md:flex-row gap-8">
                <div class="md:w-1/3">
                    <div class="bg-[#f3e8f1] rounded-xl overflow-hidden h-64">
                        <img src="${event.imageUrl}" alt="${event.title}" class="w-full h-full object-cover">
                    </div>
                    
                    <div class="mt-6 space-y-4">
                        <div>
                            <h3 class="text-lg font-medium text-[#1b0e19]">Date & Time</h3>
                            <p class="text-[#964f8c]">${formattedDate} at ${event.time}</p>
                        </div>
                        
                        <div>
                            <h3 class="text-lg font-medium text-[#1b0e19]">Location</h3>
                            <p class="text-[#964f8c]">${event.location}</p>
                        </div>
                        <div>
                            <h3 class="text-lg font-medium text-[#1b0e19] mb-2">Duration</h3>
                            <p class="text-[#964f8c]">${formatDuration(event.duration || 24)}</p>
                        </div>
                        <div>
                            <h3 class="text-lg font-medium text-[#1b0e19]">Status</h3>
                            <p class="inline-block px-3 py-1 rounded-full ${getStatusClass(event.status)}">
                                ${capitalizeFirstLetter(event.status)}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="md:w-2/3">
                    <h2 class="text-2xl font-bold text-[#1b0e19] mb-4">${event.title}</h2>
                    
                    <div class="flex flex-wrap gap-2 mb-6">
                        ${event.topics.map(topic => `
                            <span class="px-2 py-1 text-xs rounded-full bg-[#f3e8f1] text-[#92137f]">
                                ${topic}
                            </span>
                        `).join('')}
                    </div>
                    
                    <div class="prose max-w-none">
                        ${formatDescription(event.description)}
                    </div>
                    
                    <div class="mt-8">
                        <h3 class="text-lg font-medium text-[#1b0e19] mb-2">Volunteers</h3>
                        ${event.volunteers && event.volunteers.length > 0 ? `
                            <div class="bg-[#fbf8fb] rounded-lg p-4">
                                <table class="w-full">
                                    <thead>
                                        <tr class="border-b border-[#e6d0e3]">
                                            <th class="text-left p-2">User</th>
                                            <th class="text-left p-2">Role</th>
                                            <th class="text-left p-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${event.volunteers.map(volunteer => `
                                            <tr class="border-b border-[#e6d0e3]">
                                                <td class="p-2">${volunteer.user ? 
                                                    (volunteer.user.firstName && volunteer.user.lastName ? 
                                                    `${volunteer.user.firstName} ${volunteer.user.lastName} (${volunteer.user.schoolId})` : 
                                                    'Unknown User') : 'Unknown User'}</td>
                                                <td class="p-2">${volunteer.role}</td>
                                                <td class="p-2">${capitalizeFirstLetter(volunteer.status)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <p class="text-[#964f8c]">No volunteers have signed up yet.</p>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // Helper functions
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
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

    // Set admin initials
    function setAdminInitials() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.initials) {
            document.getElementById('adminInitials').textContent = user.initials;
        }
    }

    // Show notification function
    function showNotification(message, type = 'error') {
        const notification = document.getElementById('notification');
        const notificationContent = notification.querySelector('div');
        
        notificationContent.className = 'mb-4 rounded-xl p-4 ' + 
            (type === 'success' 
                ? 'bg-[#f3f9f3] border border-[#92137f] text-[#1b0e19]'
                : 'bg-[#fdf2f1] border border-[#e6d0e3] text-[#1b0e19]');
        
        notificationContent.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
});