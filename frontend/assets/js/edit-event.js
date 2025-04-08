// frontend/assets/js/edit-event.js
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

    // Define available topics
    const availableTopics = [
        'Academics',
        'Research',
        'Athletics',
        'Art & Culture',
        'Public Service',
        'Health',
        'Sustainability',
        'Diversity Equity & Inclusion',
        'Global',
        'Alumni',
        'Giving',
        'News'
    ];

    // Initialize
    renderTopicsCheckboxes();
    fetchEventDetails(eventId);
    setAdminInitials();

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    // Edit event form handler
    document.getElementById('editEventForm').addEventListener('submit', async function(e) {
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
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData // FormData handles the multipart/form-data content type
            });
    
            const data = await response.json();
            
            if (response.ok) {
                showNotification('Event updated successfully', 'success');
                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = `/admin/event-detail?id=${eventId}`;
                }, 1500);
            } else {
                showNotification(data.message);
            }
        } catch (error) {
            showNotification('Error updating event');
        }
    });

    function renderTopicsCheckboxes() {
        const topicsContainer = document.getElementById('topicsContainer');
        
        topicsContainer.innerHTML = availableTopics.map(topic => `
            <label class="flex items-center gap-2">
                <input type="checkbox" name="topics" value="${topic}" class="rounded border-[#e6d0e3] text-[#92137f] focus:ring-[#92137f]">
                <span class="text-[#1b0e19]">${topic}</span>
            </label>
        `).join('');
    }

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
            
            fillFormWithEventData(event);
        } catch (error) {
            showNotification('Error loading event details');
            setTimeout(() => {
                window.location.href = '/admin/events';
            }, 2000);
        }
    }

    function fillFormWithEventData(event) {
        // Format date for the input
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toISOString().split('T')[0];
        
        // Fill form fields
        document.querySelector('input[name="title"]').value = event.title;
        document.querySelector('input[name="date"]').value = formattedDate;
        document.querySelector('input[name="time"]').value = event.time;
        document.querySelector('input[name="location"]').value = event.location;
        document.querySelector('textarea[name="description"]').value = event.description;
        
        // Set duration
        document.querySelector('input[name="duration"]').value = event.duration || 24;
        
        // Show current image
        const currentImage = document.getElementById('currentImage');
        currentImage.src = event.imageUrl;
        
        document.querySelector('select[name="status"]').value = event.status;
        
        // Check appropriate topic checkboxes
        const topicCheckboxes = document.querySelectorAll('input[name="topics"]');
        topicCheckboxes.forEach(checkbox => {
            if (event.topics.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
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