// frontend/assets/js/events.js
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
    }

    // Initialize
    fetchEvents();
    setAdminInitials();

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    async function fetchEvents() {
        try {
            const response = await fetch('/api/events', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            const eventsContainer = document.getElementById('eventsContainer');
            
            if (data.events && data.events.length > 0) {
                eventsContainer.innerHTML = data.events.map(event => `
                    <div class="flex items-center gap-4 bg-[#fbf8fb] p-4 rounded-lg">
                        <div class="w-24 h-24 bg-[#f3e8f1] rounded-lg overflow-hidden">
                            <img src="${event.imageUrl}" alt="${event.title}" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-medium text-[#1b0e19]">
                                <a href="/admin/event-detail?id=${event._id}" class="hover:text-[#92137f]">${event.title}</a>
                            </h3>
                            <p class="text-[#964f8c] text-sm">${formatDate(event.date)} at ${event.time}</p>
                            <p class="text-[#1b0e19] mt-1">${event.location}</p>
                            <div class="flex flex-wrap gap-2 mt-2">
                                ${event.topics.map(topic => `
                                    <span class="px-2 py-1 text-xs rounded-full bg-[#f3e8f1] text-[#92137f]">
                                        ${topic}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                        <div class="flex flex-col gap-2">
                            <a href="/admin/edit-event?id=${event._id}" class="text-blue-500 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50">
                                Edit
                            </a>
                            <button onclick="deleteEvent('${event._id}')"
                                class="text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50">
                                Delete
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                eventsContainer.innerHTML = `
                    <div class="text-center py-8 text-[#964f8c]">
                        No events found. Create your first event.
                    </div>
                `;
            }
        } catch (error) {
            showNotification('Error fetching events');
        }
    }

    // Set admin initials
    function setAdminInitials() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.initials) {
            document.getElementById('adminInitials').textContent = user.initials;
        }
    }

    // Format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
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

// Delete event function
async function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/events/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Event deleted successfully', 'success');
            // Refresh events list
            location.reload();
        } else {
            const data = await response.json();
            showNotification(data.message);
        }
    } catch (error) {
        showNotification('Error deleting event');
    }
}

// Show notification function outside DOMContentLoaded for global access
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