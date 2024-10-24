document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get current tab information
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Pre-fill form with page title and URL
        document.getElementById('title').value = tab.title || '';
        document.getElementById('description').value = tab.url ? `Source: ${tab.url}` : '';
        
        // Set default date and time
        const now = new Date();
        document.getElementById('date').value = now.toISOString().split('T')[0];
        document.getElementById('time').value = now.toTimeString().slice(0, 5);
        
        // Handle recurring event selection
        const recurringSelect = document.getElementById('recurring');
        const recurringEndGroup = document.getElementById('recurringEndGroup');
        
        recurringSelect.addEventListener('change', () => {
            recurringEndGroup.style.display = recurringSelect.value ? 'flex' : 'none';
            if (recurringSelect.value) {
                // Set default end date to 1 month from start
                const endDate = new Date(document.getElementById('date').value);
                endDate.setMonth(endDate.getMonth() + 1);
                document.getElementById('recurringEnd').value = endDate.toISOString().split('T')[0];
            }
        });

        // Preview button handler
        const previewBtn = document.getElementById('previewBtn');
        const editBtn = document.getElementById('editBtn');
        const previewSection = document.getElementById('previewSection');
        const formGroups = document.querySelectorAll('.form-group');
        
        previewBtn.addEventListener('click', () => {
            try {
                const eventDetails = getEventDetails();
                
                // Update preview content
                document.getElementById('previewTitle').textContent = eventDetails.title;
                document.getElementById('previewDateTime').textContent = 
                    formatDateTime(eventDetails.date, eventDetails.time);
                document.getElementById('previewDescription').textContent = eventDetails.description;
                document.getElementById('previewRecurrence').textContent = 
                    formatRecurrence(eventDetails.recurring, eventDetails.recurringEnd);
                
                // Show preview section and hide preview button
                previewSection.classList.remove('hidden');
                previewBtn.classList.add('hidden');
                
                // Hide form groups
                formGroups.forEach(group => {
                    group.style.display = 'none';
                });
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
        
        // Edit button handler
        editBtn.addEventListener('click', () => {
            try {
                // Hide preview section and show preview button
                previewSection.classList.add('hidden');
                previewBtn.classList.remove('hidden');
                
                // Show form groups
                formGroups.forEach(group => {
                    if (group.id === 'recurringEndGroup') {
                        // Only show if recurring is selected
                        group.style.display = recurringSelect.value ? 'flex' : 'none';
                    } else {
                        group.style.display = 'flex';
                    }
                });
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
        
        // Handle form submission
        document.getElementById('eventForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const confirmBtn = document.getElementById('confirmBtn');
            confirmBtn.disabled = true;
            
            try {
                const eventDetails = getEventDetails();
                await createCalendarEvent(eventDetails);
                showNotification('Event created successfully!', 'success');
                
                // Close popup after 2 seconds
                setTimeout(() => window.close(), 2000);
                
            } catch (error) {
                showNotification(error.message, 'error');
                confirmBtn.disabled = false;
            }
        });
    } catch (error) {
        showNotification('Failed to initialize popup: ' + error.message, 'error');
    }
});

function getEventDetails() {
    const title = document.getElementById('title').value;
    if (!title) throw new Error('Event title is required');
    
    return {
        title,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        description: document.getElementById('description').value,
        recurring: document.getElementById('recurring').value,
        recurringEnd: document.getElementById('recurringEnd').value
    };
}

function formatDateTime(date, time) {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });
}

function formatRecurrence(recurring, endDate) {
    if (!recurring) return 'One-time event';
    
    const frequency = recurring.toLowerCase();
    const until = endDate ? ` until ${new Date(endDate).toLocaleDateString()}` : '';
    return `Repeats ${frequency}${until}`;
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden', 'success', 'error');
    notification.classList.add(type);
}
