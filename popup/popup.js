document.addEventListener('DOMContentLoaded', async () => {
    // Get current tab information
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Pre-fill form with page title and URL
    document.getElementById('title').value = tab.title;
    document.getElementById('description').value = `Source: ${tab.url}`;
    
    // Set default date and time
    const now = new Date();
    document.getElementById('date').value = now.toISOString().split('T')[0];
    document.getElementById('time').value = now.toTimeString().slice(0, 5);
    
    // Handle form submission
    document.getElementById('eventForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        
        try {
            const eventDetails = {
                title: document.getElementById('title').value,
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                description: document.getElementById('description').value
            };
            
            await createCalendarEvent(eventDetails);
            showNotification('Event created successfully!', 'success');
            
            // Close popup after 2 seconds
            setTimeout(() => window.close(), 2000);
            
        } catch (error) {
            showNotification(error.message, 'error');
            submitBtn.disabled = false;
        }
    });
});

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden', 'success', 'error');
    notification.classList.add(type);
}
