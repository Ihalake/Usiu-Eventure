// frontend/assets/js/student-common.js

// Function to update notification badge in sidebar
async function updateNotificationBadge() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Count unread notifications
            const unreadCount = data.notifications ? 
                data.notifications.filter(n => !n.isRead).length : 0;
            
            // Update sidebar notification badge
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

// Function to update bookmark count in sidebar
async function updateBookmarkBadge() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/student/bookmarks', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Count bookmarked events
            const bookmarksCount = data.bookmarkedEvents ? data.bookmarkedEvents.length : 0;
            
            // Update sidebar bookmark badge
            const bookmarkLink = document.querySelector('a[href="/student/bookmarks"]');
            if (bookmarkLink) {
                // If there's an existing badge, update it, otherwise create it
                let badge = bookmarkLink.querySelector('.bookmark-badge');
                
                if (bookmarksCount > 0) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'bookmark-badge ml-auto bg-[#92137f] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center';
                        bookmarkLink.appendChild(badge);
                    }
                    badge.textContent = bookmarksCount > 9 ? '9+' : bookmarksCount;
                } else if (badge) {
                    // Remove badge if count is 0
                    badge.remove();
                }
            }
        }
    } catch (error) {
        console.error('Error fetching bookmarks count:', error);
    }
}

// Set user information in sidebar
function setUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        const userInitials = document.getElementById('userInitials');
        const userName = document.getElementById('userName');
        
        if (userInitials) {
            // Use initials from user object, or generate from first and last name
            if (user.initials) {
                userInitials.textContent = user.initials;
            } else if (user.firstName && user.lastName) {
                userInitials.textContent = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
            } else {
                userInitials.textContent = 'ST';
            }
        }
        
        if (userName) {
            // Use full name if available
            if (user.firstName && user.lastName) {
                userName.textContent = user.firstName + ' ' + user.lastName;
            } else if (user.name) {
                userName.textContent = user.name;
            } else {
                userName.textContent = 'Student';
            }
        }
    }
}

// Function to periodically check for new notifications
function startNotificationPolling() {
    // Check for new notifications every 2 minutes
    setInterval(updateNotificationBadge, 2 * 60 * 1000);
}

// Update the initCommon function to start polling
function initCommon() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Check authentication
    if (!token || !user) {
        window.location.href = '/auth/login';
        return false;
    }
    
    setUserInfo();
    setupLogout();
    updateNotificationBadge();
    updateBookmarkBadge();
    startNotificationPolling(); // Start polling for new notifications
    
    return true;
}


// Logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        });
    }
}

// Initialize common functionality
function initCommon() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Check authentication
    if (!token || !user) {
        window.location.href = '/auth/login';
        return false;
    }
    
    setUserInfo();
    setupLogout();
    updateNotificationBadge();
    
    return true;
}