// frontend/assets/js/student-dashboard.js
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
    document.getElementById('welcomeName').textContent = user.firstName;

    // Initialize
    fetchDashboardData();
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    async function fetchDashboardData() {
        try {
            // Fetch dashboard data
            const response = await fetch('/api/student/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }
    
            const data = await response.json();
            
            // Update stats
            document.getElementById('upcomingEventsCount').textContent = data.stats.upcomingEvents || 0;
            document.getElementById('volunteeringCount').textContent = data.stats.volunteering || 0;
            document.getElementById('bookmarkedCount').textContent = data.stats.bookmarked || 0;
    
            // Update upcoming events list
            const upcomingEventsList = document.getElementById('upcomingEventsList');
            
            if (data.upcomingEvents && data.upcomingEvents.length > 0) {
                upcomingEventsList.innerHTML = data.upcomingEvents.map(event => `
                    <div class="flex items-center justify-between p-4 border border-[#e6d0e3] rounded-lg">
                        <div class="flex items-center gap-4">
                            <div class="w-16 h-16 bg-[#f3e8f1] rounded-lg overflow-hidden">
                                <img src="${event.imageUrl}" alt="${event.title}" class="w-full h-full object-cover">
                            </div>
                            <div>
                                <h3 class="font-medium text-[#1b0e19]">${event.title}</h3>
                                <p class="text-sm text-[#964f8c]">${formatDate(event.date)} at ${event.time}</p>
                            </div>
                        </div>
                        <a href="/student/event/${event._id}" class="text-[#92137f] hover:underline">View Details</a>
                    </div>
                `).join('');
            } else {
                upcomingEventsList.innerHTML = `
                    <p class="text-[#964f8c] text-center py-4">No upcoming events</p>
                `;
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            showNotification('Failed to load dashboard data. Please try again later.', 'error');
        }

     // Fetch unread notifications count
        try {
            const notificationsResponse = await fetch('/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (notificationsResponse.ok) {
                const notificationsData = await notificationsResponse.json();
                
                // Count unread notifications
                const unreadCount = notificationsData.notifications ? 
                    notificationsData.notifications.filter(n => !n.isRead).length : 0;
                
                // Update sidebar notification badge if it exists
                const notificationLink = document.querySelector('a[href="/student/notifications"]');
                if (notificationLink) {
                    // If there's an existing badge, update it, otherwise create it
                    let badge = notificationLink.querySelector('.notification-badge');
                    
                    if (unreadCount > 0) {
                        if (!badge) {
                            badge = document.createElement('span');
                            badge.className = 'notification-badge ml-auto bg-[#92137f] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center';
                            notificationLink.appendChild(badge);
                        }
                        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                    } else if (badge) {
                        // Remove badge if count is 0
                        badge.remove();
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching notifications count:', error);
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