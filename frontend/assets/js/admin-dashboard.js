// frontend/assets/js/admin-dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
    }

    // Initialize
    setAdminInitials();
    fetchDashboardStats();
    fetchVolunteers('all'); // Start with all volunteers

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    // Volunteer filter buttons
    document.getElementById('allVolunteersBtn').addEventListener('click', () => applyVolunteerFilter('all'));
    document.getElementById('pendingVolunteersBtn').addEventListener('click', () => applyVolunteerFilter('pending'));
    document.getElementById('approvedVolunteersBtn').addEventListener('click', () => applyVolunteerFilter('approved'));
    document.getElementById('rejectedVolunteersBtn').addEventListener('click', () => applyVolunteerFilter('rejected'));

    function applyVolunteerFilter(filter) {
        // Update active button
        const filterButtons = {
            'all': 'allVolunteersBtn',
            'pending': 'pendingVolunteersBtn',
            'approved': 'approvedVolunteersBtn',
            'rejected': 'rejectedVolunteersBtn'
        };
        
        Object.entries(filterButtons).forEach(([key, id]) => {
            const btn = document.getElementById(id);
            if (key === filter) {
                btn.classList.remove('bg-[#f3e8f1]', 'text-[#1b0e19]');
                btn.classList.add('bg-[#92137f]', 'text-white');
            } else {
                btn.classList.remove('bg-[#92137f]', 'text-white');
                btn.classList.add('bg-[#f3e8f1]', 'text-[#1b0e19]');
            }
        });

        fetchVolunteers(filter);
    }

    async function fetchDashboardStats() {
        try {
            // We'll need to create an endpoint for these stats
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            
            // Update stats
            document.getElementById('totalEventsCount').textContent = data.totalEvents || 0;
            document.getElementById('totalVolunteersCount').textContent = data.totalVolunteers || 0;
            document.getElementById('registeredStudentsCount').textContent = data.registeredStudents || 0;

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // For now, let's just use placeholders until we implement the endpoint
            document.getElementById('totalEventsCount').textContent = '...';
            document.getElementById('totalVolunteersCount').textContent = '...';
            document.getElementById('registeredStudentsCount').textContent = '...';
        }
    }

    async function fetchVolunteers(status) {
        try {
            document.getElementById('volunteersContainer').innerHTML = `
                <div class="text-center py-8">
                    <div class="animate-spin inline-block w-8 h-8 border-4 border-[#e6d0e3] border-t-[#92137f] rounded-full"></div>
                    <p class="text-[#964f8c] mt-4">Loading volunteer applications...</p>
                </div>
            `;

            // We'll need to create this endpoint
            const response = await fetch(`/api/admin/volunteers?status=${status}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch volunteers');
            }

            const data = await response.json();
            
            if (data.volunteers && data.volunteers.length > 0) {
                document.getElementById('volunteersContainer').innerHTML = data.volunteers.map(volunteer => `
                    <div class="bg-white border border-[#e6d0e3] rounded-xl shadow-sm mb-4">
                        <div class="p-4 border-b border-[#e6d0e3] flex items-center justify-between">
                            <div>
                                <h3 class="font-bold text-[#1b0e19]">${volunteer.student.firstName} ${volunteer.student.lastName}</h3>
                                <p class="text-[#964f8c] text-sm">School ID: ${volunteer.student.schoolId}</p>
                            </div>
                            <div>
                                <span class="inline-block px-3 py-1 rounded-full ${getStatusClass(volunteer.status)}">
                                    ${capitalizeFirstLetter(volunteer.status)}
                                </span>
                            </div>
                        </div>
                        <div class="p-4">
                            <div class="mb-3">
                                <h4 class="text-[#1b0e19] font-medium">Event</h4>
                                <p>${volunteer.event.title}</p>
                            </div>
                            <div class="mb-3">
                                <h4 class="text-[#1b0e19] font-medium">Role</h4>
                                <p>${volunteer.role}</p>
                            </div>
                            <div class="mb-3">
                                <h4 class="text-[#1b0e19] font-medium">Applied On</h4>
                                <p>${new Date(volunteer.createdAt).toLocaleDateString()}</p>
                            </div>
                            ${volunteer.note ? `
                                <div class="mb-3">
                                    <h4 class="text-[#1b0e19] font-medium">Note</h4>
                                    <p>${volunteer.note}</p>
                                </div>
                            ` : ''}
                            <div class="flex gap-2 mt-4">
                                ${volunteer.status === 'pending' ? `
                                    <button onclick="updateVolunteerStatus('${volunteer._id}', 'approved')" 
                                        class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
                                        Approve
                                    </button>
                                    <button onclick="updateVolunteerStatus('${volunteer._id}', 'rejected')" 
                                        class="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200">
                                        Reject
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                document.getElementById('volunteersContainer').innerHTML = `
                    <p class="text-center py-4 text-[#964f8c]">No volunteer applications found</p>
                `;
            }
        } catch (error) {
            console.error('Error fetching volunteers:', error);
            document.getElementById('volunteersContainer').innerHTML = `
                <p class="text-center py-4 text-[#964f8c]">Error loading volunteer applications</p>
            `;
        }
    }

    // Set admin initials
    function setAdminInitials() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.initials) {
            document.getElementById('adminInitials').textContent = user.initials;
        }
    }

    // Helper functions
    function getStatusClass(status) {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});

// Global function for updating volunteer status
function updateVolunteerStatus(volunteerId, status) {
    if (!confirm(`Are you sure you want to ${status} this volunteer?`)) return;
    
    const token = localStorage.getItem('token');
    
    fetch(`/api/admin/volunteers/${volunteerId}/status`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
    })
    .then(response => {
        if (response.ok) {
            showNotification(`Volunteer ${status} successfully`, 'success');
            // Refresh volunteers list
            document.getElementById('volunteersContainer').innerHTML = '';
            fetchVolunteers('all');
        } else {
            return response.json().then(data => {
                showNotification(data.message || `Error ${status} volunteer`);
            });
        }
    })
    .catch(error => {
        showNotification(`Error ${status} volunteer`);
    });
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

// Make fetchVolunteers available globally for updateVolunteerStatus function
function fetchVolunteers(status) {
    const token = localStorage.getItem('token');
    
    fetch(`/api/admin/volunteers?status=${status}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const volunteersContainer = document.getElementById('volunteersContainer');
        
        if (data.volunteers && data.volunteers.length > 0) {
            volunteersContainer.innerHTML = data.volunteers.map(volunteer => `
                <div class="bg-white border border-[#e6d0e3] rounded-xl shadow-sm mb-4">
                    <div class="p-4 border-b border-[#e6d0e3] flex items-center justify-between">
                        <div>
                            <h3 class="font-bold text-[#1b0e19]">${volunteer.student.firstName} ${volunteer.student.lastName}</h3>
                            <p class="text-[#964f8c] text-sm">School ID: ${volunteer.student.schoolId}</p>
                        </div>
                        <div>
                            <span class="inline-block px-3 py-1 rounded-full ${getStatusClass(volunteer.status)}">
                                ${capitalizeFirstLetter(volunteer.status)}
                            </span>
                        </div>
                    </div>
                    <div class="p-4">
                        <div class="mb-3">
                            <h4 class="text-[#1b0e19] font-medium">Event</h4>
                            <p>${volunteer.event.title}</p>
                        </div>
                        <div class="mb-3">
                            <h4 class="text-[#1b0e19] font-medium">Role</h4>
                            <p>${volunteer.role}</p>
                        </div>
                        <div class="mb-3">
                            <h4 class="text-[#1b0e19] font-medium">Applied On</h4>
                            <p>${new Date(volunteer.createdAt).toLocaleDateString()}</p>
                        </div>
                        ${volunteer.note ? `
                            <div class="mb-3">
                                <h4 class="text-[#1b0e19] font-medium">Note</h4>
                                <p>${volunteer.note}</p>
                            </div>
                        ` : ''}
                        <div class="flex gap-2 mt-4">
                            ${volunteer.status === 'pending' ? `
                                <button onclick="updateVolunteerStatus('${volunteer._id}', 'approved')" 
                                    class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200">
                                    Approve
                                </button>
                                <button onclick="updateVolunteerStatus('${volunteer._id}', 'rejected')" 
                                    class="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200">
                                    Reject
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            volunteersContainer.innerHTML = `
                <p class="text-center py-4 text-[#964f8c]">No volunteer applications found</p>
            `;
        }
    })
    .catch(error => {
        console.error('Error fetching volunteers:', error);
        document.getElementById('volunteersContainer').innerHTML = `
            <p class="text-center py-4 text-[#964f8c]">Error loading volunteer applications</p>
        `;
    });
}

// Helper functions for global use
function getStatusClass(status) {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'approved':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}