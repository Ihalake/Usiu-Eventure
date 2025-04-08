// frontend/assets/js/student-volunteering.js
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
    let currentFilter = 'all';

    // Set up event listeners for filter buttons
    document.getElementById('allFilter').addEventListener('click', () => applyFilter('all'));
    document.getElementById('pendingFilter').addEventListener('click', () => applyFilter('pending'));
    document.getElementById('approvedFilter').addEventListener('click', () => applyFilter('approved'));
    document.getElementById('rejectedFilter').addEventListener('click', () => applyFilter('rejected'));

    // Initial data fetch
    fetchVolunteeringData();

    // Add debug button (with proper setTimeout)
    setTimeout(() => {
        const filterContainer = document.querySelector('.flex.gap-3.mb-6');
        if (filterContainer) {
            const debugButton = document.createElement('button');
            debugButton.className = 'flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-gray-200 text-gray-700 pl-4 pr-4';
            debugButton.innerHTML = '<p class="text-sm font-medium leading-normal">Debug</p>';
            debugButton.onclick = testVolunteeringEndpoint;
            filterContainer.appendChild(debugButton);
        }
    }, 500);

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    function applyFilter(filter) {
        // Update UI for active filter
        const filterButtons = {
            'all': 'allFilter',
            'pending': 'pendingFilter',
            'approved': 'approvedFilter',
            'rejected': 'rejectedFilter'
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

        // Update current filter and fetch data
        currentFilter = filter;
        fetchVolunteeringData();
    }

    async function fetchVolunteeringData() {
        try {
            // Show loading state
            document.getElementById('volunteeringList').innerHTML = `
                <div class="text-center py-8">
                    <div class="animate-spin inline-block w-8 h-8 border-4 border-[#e6d0e3] border-t-[#92137f] rounded-full"></div>
                    <p class="text-[#964f8c] mt-4">Loading your volunteering activities...</p>
                </div>
            `;
    
            console.log(`Fetching volunteering data with filter: ${currentFilter}`);
    
            // Fetch volunteering data with filter
            const response = await fetch(`/api/student/volunteering?status=${currentFilter}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch volunteering data: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('Volunteering data received:', data);
            
            // Update volunteering list
            const volunteeringList = document.getElementById('volunteeringList');
            
            if (data.volunteering && data.volunteering.length > 0) {
                console.log(`Displaying ${data.volunteering.length} volunteering items`);
                volunteeringList.innerHTML = data.volunteering.map(item => `
                    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div class="flex items-center justify-between p-6 border-b border-[#e6d0e3]">
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 bg-[#f3e8f1] rounded-lg overflow-hidden">
                                    <img src="${item.event.imageUrl}" alt="${item.event.title}" class="w-full h-full object-cover">
                                </div>
                                <div>
                                    <h3 class="text-lg font-medium text-[#1b0e19] mb-1">${item.event.title}</h3>
                                    <p class="text-sm text-[#964f8c]">${formatDate(item.event.date)} at ${item.event.time}</p>
                                </div>
                            </div>
                            <div>
                                <span class="inline-block px-3 py-1 rounded-full ${getStatusClass(item.status)}">
                                    ${capitalizeFirstLetter(item.status)}
                                </span>
                            </div>
                        </div>
                        <div class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 class="font-medium text-[#1b0e19] mb-2">Role</h4>
                                    <p class="text-[#964f8c]">${item.role}</p>
                                </div>
                                ${item.note ? `
                                <div>
                                    <h4 class="font-medium text-[#1b0e19] mb-2">Your Note</h4>
                                    <p class="text-[#964f8c]">${item.note}</p>
                                </div>
                                ` : ''}
                            </div>
                            <div class="mt-6 flex justify-end">
                                <a href="/student/event/${item.event._id}" class="text-[#92137f] hover:underline">View Event Details</a>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                console.log('No volunteering data found');
                volunteeringList.innerHTML = `
                    <div class="bg-white rounded-xl shadow-sm p-8 text-center">
                        <p class="text-[#964f8c] mb-4">You haven't volunteered for any events yet.</p>
                        <a href="/student/events" class="text-[#92137f] hover:underline">Explore events to volunteer</a>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error fetching volunteering data:', error);
            
            document.getElementById('volunteeringList').innerHTML = `
                <div class="bg-white rounded-xl shadow-sm p-8 text-center">
                    <p class="text-[#964f8c] mb-4">Failed to load volunteering data.</p>
                    <button onclick="fetchVolunteeringData()" class="bg-[#92137f] text-white px-4 py-2 rounded-lg hover:bg-[#7b0f6b] transition-colors">
                        Try Again
                    </button>
                </div>
            `;
            
            showNotification('Failed to load volunteering data. Please try again later.', 'error');
        }
    }

    async function testVolunteeringEndpoint() {
        try {
            console.log('Testing volunteering endpoint...');
            const response = await fetch('/api/student/volunteering-test', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Test endpoint failed: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Test endpoint response:', data);
            
            // Display the debug information
            document.getElementById('volunteeringList').innerHTML = `
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-lg font-bold text-[#1b0e19] mb-4">Debug Information</h3>
                    <pre class="bg-gray-100 p-4 rounded overflow-auto max-h-96">${JSON.stringify(data, null, 2)}</pre>
                    <button onclick="fetchVolunteeringData()" class="mt-4 bg-[#92137f] text-white px-4 py-2 rounded-lg hover:bg-[#7b0f6b] transition-colors">
                        Return to normal view
                    </button>
                </div>
            `;
        } catch (error) {
            console.error('Test endpoint error:', error);
            showNotification('Test endpoint failed: ' + error.message, 'error');
        }
    }

    // Helper functions
    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

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