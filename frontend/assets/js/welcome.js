// frontend/assets/js/welcome.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    loadTopics();
    fetchEvents();

    // Topic filter functionality
    const topicsFilter = document.getElementById('topicsFilter');
    topicsFilter.addEventListener('click', function(e) {
        if (e.target.closest('.topic-btn')) {
            const btn = e.target.closest('.topic-btn');
            const topic = btn.dataset.topic;
            
            // Remove active class from all buttons
            document.querySelectorAll('.topic-btn').forEach(button => {
                button.classList.remove('active');
                button.classList.remove('bg-[#92137f]');
                button.classList.remove('text-white');
                button.classList.add('bg-[#f4f0f4]');
                button.classList.add('text-[#171117]');
            });
            
            // Add active class to clicked button
            btn.classList.add('active');
            btn.classList.add('bg-[#92137f]');
            btn.classList.add('text-white');
            btn.classList.remove('bg-[#f4f0f4]');
            btn.classList.remove('text-[#171117]');
            
            // Filter events
            fetchEvents(topic);
        }
    });

    // Load available topics
    function loadTopics() {
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

        const topicsFilter = document.getElementById('topicsFilter');
        
        availableTopics.forEach(topic => {
            const button = document.createElement('button');
            button.className = 'flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-[#f4f0f4] pl-2 pr-4 topic-btn';
            button.dataset.topic = topic;
            button.innerHTML = `<p class="text-[#171117] text-sm font-medium leading-normal">${topic}</p>`;
            topicsFilter.appendChild(button);
        });
    }

    async function fetchEvents(topic = 'all') {
        try {
            // Changed to use the main events endpoint since we don't have the public endpoint yet
            let url = '/api/events';
            // We'll handle filtering on the client side until backend filtering is implemented
            
            const response = await fetch(url);
            const data = await response.json();
            
            const eventsContainer = document.getElementById('eventsContainer');
            
            let filteredEvents = data.events || [];
            
            // Filter events by topic if specified
            if (topic !== 'all' && filteredEvents.length > 0) {
                filteredEvents = filteredEvents.filter(event => 
                    event.topics && event.topics.includes(topic)
                );
            }
            
            // Filter to show only upcoming events
            filteredEvents = filteredEvents.filter(event => 
                event.status === 'upcoming' || event.status === 'ongoing'
            );
            
            if (filteredEvents && filteredEvents.length > 0) {
                eventsContainer.innerHTML = filteredEvents.map(event => `
                    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div class="h-48 bg-[#f3e8f1] overflow-hidden">
                            <img src="${event.imageUrl}" alt="${event.title}" class="w-full h-full object-cover">
                        </div>
                        <div class="p-6">
                            <div class="flex flex-wrap gap-2 mb-4">
                                ${event.topics.map(topic => `
                                    <span class="px-2 py-1 text-xs rounded-full bg-[#f3e8f1] text-[#92137f]">
                                        ${topic}
                                    </span>
                                `).join('')}
                            </div>
                            <h3 class="text-xl font-bold text-[#1b0e19] mb-2">${event.title}</h3>
                            <p class="text-[#964f8c] mb-4">${formatDate(event.date)} at ${event.time}</p>
                            <p class="text-[#1b0e19] mb-6">${truncateDescription(event.description, 100)}</p>
                            <div class="flex justify-between items-center">
                                <span class="text-[#1b0e19] text-sm">${event.location}</span>
                                <a href="/event-details?id=${event._id}" class="bg-[#92137f] text-white px-4 py-2 rounded-lg hover:bg-[#7b0f6b] transition-colors text-sm">
                                    View Details
                                </a>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                eventsContainer.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <p class="text-[#964f8c] text-lg">No events found. Check back later!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            
            const eventsContainer = document.getElementById('eventsContainer');
            eventsContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-[#964f8c] text-lg">Oops! Something went wrong. Please try again later.</p>
                </div>
            `;
        }
    }

    // Helper functions
    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function truncateDescription(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
});