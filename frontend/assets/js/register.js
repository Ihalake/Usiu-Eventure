// frontend/assets/js/register.js
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(registerForm);
      const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        schoolId: formData.get('schoolId'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
      };
      
      // Basic validation
      if (userData.password !== userData.confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
      }
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            schoolId: userData.schoolId,
            password: userData.password
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Show success notification
          showNotification(data.message, 'success');
          
          // Clear form
          registerForm.reset();
          
          // Redirect to login page after 2 seconds
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
        } else {
          showNotification(data.message, 'error');
        }
      } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred during registration. Please try again.', 'error');
      }
    });
    
    // Show notification function
    function showNotification(message, type) {
      const notification = document.getElementById('notification');
      const notificationContent = notification.querySelector('div');
      
      // Set notification type
      if (type === 'success') {
        notificationContent.className = 'rounded-xl bg-green-100 border border-green-400 p-4 text-[#1b0e19]';
      } else {
        notificationContent.className = 'rounded-xl bg-red-100 border border-red-400 p-4 text-[#1b0e19]';
      }
      
      // Set message and show notification
      notificationContent.textContent = message;
      notification.classList.remove('hidden');
      
      // Auto-hide after 5 seconds for success messages
      if (type === 'success') {
        setTimeout(() => {
          notification.classList.add('hidden');
        }, 5000);
      }
    }
  });