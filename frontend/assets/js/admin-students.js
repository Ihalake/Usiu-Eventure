// frontend/assets/js/admin-students.js
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
    }

    // Initialize
    setAdminInitials();
    fetchStudents();

    // Search functionality
    document.getElementById('studentSearch').addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#studentsTableBody tr');
        
        rows.forEach(row => {
            const fullName = row.querySelector('td:first-child')?.textContent.toLowerCase() || '';
            const schoolId = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
            const email = row.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
            
            if (fullName.includes(searchTerm) || schoolId.includes(searchTerm) || email.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    async function fetchStudents() {
        try {
            const response = await fetch('/api/auth/students', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            const tableBody = document.getElementById('studentsTableBody');
            
            if (data.students && data.students.length > 0) {
                tableBody.innerHTML = data.students.map(student => `
                    <tr class="border-b border-[#e6d0e3]">
                        <td class="p-3">${student.firstName} ${student.lastName}</td>
                        <td class="p-3">${student.schoolId}</td>
                        <td class="p-3">${student.email}</td>
                        <td class="p-3">${new Date(student.createdAt).toLocaleDateString()}</td>
                        <td class="p-3">
                            <button onclick="deleteStudent('${student._id}')"
                                class="text-red-500 hover:text-red-700">Delete</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center p-4 text-[#964f8c]">
                            No students registered yet
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            showNotification('Error fetching students');
        }
    }

    // Set admin initials
    function setAdminInitials() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.initials) {
            document.getElementById('adminInitials').textContent = user.initials;
        }
    }
});

// Global function for student deletion
function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    const token = localStorage.getItem('token');
    
    fetch(`/api/auth/students/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (response.ok) {
            showNotification('Student deleted successfully', 'success');
            // Refresh students list
            location.reload();
        } else {
            return response.json().then(data => {
                showNotification(data.message || 'Error deleting student');
            });
        }
    })
    .catch(error => {
        console.error('Error deleting student:', error);
        showNotification('Error deleting student');
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