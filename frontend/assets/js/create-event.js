// frontend/assets/js/create-event.js
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
    }

    // Initialize
    setAdminInitials();

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    // Create event form handler
    document.getElementById('createEventForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Create FormData from the form
        const formData = new FormData(e.target);
        
        // Get selected topics
        const selectedTopics = Array.from(document.querySelectorAll('input[name="topics"]:checked')).map(checkbox => checkbox.value);
        
        // Remove any topics from FormData (we'll add them back properly)
        for (const pair of formData.entries()) {
            if (pair[0] === 'topics') {
                formData.delete('topics');
            }
        }
        
        // Add topics correctly
        selectedTopics.forEach(topic => {
            formData.append('topics', topic);
        });
        
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData // FormData handles the multipart/form-data content type
            });
    
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Event created successfully', 'success');
                // Reset form
                e.target.reset();
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = '/admin/events';
                }, 1500);
            } else {
                showNotification(data.message);
            }
        } catch (error) {
            showNotification('Error creating event');
        }
    });

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