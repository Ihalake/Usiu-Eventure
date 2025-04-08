// frontend/assets/js/student-notifications.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize common functionality
    if (!initCommon()) return;

    // Initialize
    fetchNotifications();
    
    // Mark all as read button
    document.getElementById('markAllReadBtn').addEventListener('click', markAllAsRead);

    async function fetchNotifications() {
        const token = localStorage.getItem('token');
        try {
            document.getElementById('notificationList').innerHTML = `
                <div class="text-center py-8">
                    <div class="animate-spin inline-block w-8 h-8 border-4 border-[#e6d0e3] border-t-[#92137f] rounded-full"></div>
                    <p class="text-[#964f8c] mt-4">Loading notifications...</p>
                </div>
            `;

            const response = await fetch('/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }

            const data = await response.json();
            
            if (data.notifications && data.notifications.length > 0) {
                document.getElementById('notificationList').innerHTML = data.notifications.map(notification => `
                    <div class="p-4 rounded-xl ${notification.isRead ? 'bg-white' : 'bg-[#f3e8f1] border-l-4 border-[#92137f]'} shadow-sm">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-[#1b0e19]">${notification.title}</h3>
                            <div class="flex gap-2">
                                ${!notification.isRead ? `
                                <button onclick="markAsRead('${notification._id}')" class="text-[#92137f] hover:text-[#7b0f6b]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                                        <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path>
                                    </svg>
                                </button>
                                ` : ''}
                                <button onclick="deleteNotification('${notification._id}')" class="text-red-500 hover:text-red-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                                        <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <p class="text-[#964f8c] mb-2">${notification.message}</p>
                        ${notification.relatedEvent ? `
                        <div class="mt-3">
                            <a href="/student/event/${notification.relatedEvent._id}" class="text-[#92137f] hover:underline">
                                View Event Details
                            </a>
                        </div>
                        ` : ''}
                        <div class="text-sm text-gray-500 mt-2">
                            ${formatDate(notification.createdAt)}
                        </div>
                    </div>
                `).join('');
            } else {
                document.getElementById('notificationList').innerHTML = `
                    <div class="text-center p-8 bg-white rounded-xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mx-auto mb-4 text-[#92137f]" viewBox="0 0 256 256">
                            <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06Z"></path>
                        </svg>
                        <p class="text-[#964f8c] text-lg mb-4">No notifications yet</p>
                        <p class="text-[#1b0e19]">When you receive updates about events or volunteer status, they'll appear here.</p>
                    </div>
                `;
            }
            
            // Update notification badge after fetching
            updateNotificationBadge();
        } catch (error) {
            console.error('Error fetching notifications:', error);
            document.getElementById('notificationList').innerHTML = `
                <div class="text-center p-8 bg-white rounded-xl shadow-sm">
                    <p class="text-[#964f8c] text-lg mb-4">Error loading notifications</p>
                    <button onclick="fetchNotifications()" class="bg-[#92137f] text-white px-4 py-2 rounded-lg hover:bg-[#7b0f6b]">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    // Make these functions available globally
    window.markAsRead = async function(id) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Refresh notifications
                fetchNotifications();
                showNotification('Notification marked as read', 'success');
            } else {
                throw new Error('Failed to mark notification as read');
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            showNotification('Error updating notification');
        }
    };

    window.deleteNotification = async function(id) {
        if (!confirm('Are you sure you want to delete this notification?')) return;
        
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Refresh notifications
                fetchNotifications();
                showNotification('Notification deleted', 'success');
            } else {
                throw new Error('Failed to delete notification');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            showNotification('Error deleting notification');
        }
    };

    async function markAllAsRead() {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Refresh notifications
                fetchNotifications();
                showNotification('All notifications marked as read', 'success');
            } else {
                throw new Error('Failed to mark all notifications as read');
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            showNotification('Error updating notifications');
        }
    }

    // Helper functions
    function formatDate(dateString) {
        const date = new Date(dateString);
        
        // If the notification is from today, show the time
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // If from yesterday, show "Yesterday"
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Otherwise show the full date
        return date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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