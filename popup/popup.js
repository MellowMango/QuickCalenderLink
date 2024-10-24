document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    initializePopup().catch(error => {
        console.error('Initialization error:', error);
        showNotification(error.message, 'error');
    });
});

async function initializePopup() {
    try {
        // Get current tab information
        console.log('Fetching current tab information...');
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true }).catch(error => {
            throw new Error('Failed to get current tab information: ' + error.message);
        });
        
        if (!tabs || tabs.length === 0) {
            throw new Error('No active tab found');
        }
        
        const tab = tabs[0];
        
        // Pre-fill form with page title and URL
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');
        
        if (!titleInput || !descriptionInput) {
            throw new Error('Required form elements not found');
        }
        
        titleInput.value = tab.title || '';
        descriptionInput.value = tab.url ? `Source: ${tab.url}` : '';
        
        // Set default date and time
        const now = new Date();
        document.getElementById('date').value = now.toISOString().split('T')[0];
        document.getElementById('time').value = now.toTimeString().slice(0, 5);
        
        setupEventHandlers();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize popup: ' + error.message, 'error');
    }
}

function setupEventHandlers() {
    console.log('Setting up event handlers...');
    
    // Handle recurring event selection
    const recurringSelect = document.getElementById('recurring');
    const recurringEndGroup = document.getElementById('recurringEndGroup');
    
    if (recurringSelect && recurringEndGroup) {
        recurringSelect.addEventListener('change', () => {
            recurringEndGroup.style.display = recurringSelect.value ? 'flex' : 'none';
            if (recurringSelect.value) {
                const endDate = new Date(document.getElementById('date').value);
                endDate.setMonth(endDate.getMonth() + 1);
                document.getElementById('recurringEnd').value = endDate.toISOString().split('T')[0];
            }
        });
    }

    // Preview button handler
    const previewBtn = document.getElementById('previewBtn');
    const editBtn = document.getElementById('editBtn');
    const previewSection = document.getElementById('previewSection');
    const formGroups = document.querySelectorAll('.form-group');
    
    if (!previewBtn || !editBtn || !previewSection) {
        console.error('Preview elements not found');
        return;
    }
    
    previewBtn.addEventListener('click', () => {
        console.log('Preview button clicked');
        try {
            // Add loading state
            previewBtn.disabled = true;
            previewBtn.textContent = 'Loading preview...';
            
            const eventDetails = getEventDetails();
            console.log('Event details:', eventDetails);
            
            // Update preview content
            document.getElementById('previewTitle').textContent = eventDetails.title;
            document.getElementById('previewDateTime').textContent = 
                formatDateTime(eventDetails.date, eventDetails.time);
            document.getElementById('previewDescription').textContent = eventDetails.description || 'No description';
            document.getElementById('previewRecurrence').textContent = 
                formatRecurrence(eventDetails.recurring, eventDetails.recurringEnd);
            
            // Show preview section with smooth transition
            previewSection.style.opacity = '0';
            previewSection.classList.remove('hidden');
            setTimeout(() => {
                previewSection.style.opacity = '1';
                previewBtn.classList.add('hidden');
                
                // Hide form groups with smooth transition
                formGroups.forEach(group => {
                    group.style.opacity = '0';
                    setTimeout(() => {
                        group.style.display = 'none';
                    }, 300);
                });
            }, 50);
            
        } catch (error) {
            console.error('Preview error:', error);
            showNotification(error.message, 'error');
        } finally {
            // Reset button state
            previewBtn.disabled = false;
            previewBtn.textContent = 'Preview Event';
        }
    });
    
    // Edit button handler
    editBtn.addEventListener('click', () => {
        console.log('Edit button clicked');
        try {
            // Hide preview section with smooth transition
            previewSection.style.opacity = '0';
            setTimeout(() => {
                previewSection.classList.add('hidden');
                previewBtn.classList.remove('hidden');
                
                // Show form groups with smooth transition
                formGroups.forEach(group => {
                    if (group.id === 'recurringEndGroup') {
                        group.style.display = recurringSelect.value ? 'flex' : 'none';
                    } else {
                        group.style.display = 'flex';
                    }
                    setTimeout(() => {
                        group.style.opacity = '1';
                    }, 50);
                });
            }, 300);
            
        } catch (error) {
            console.error('Edit error:', error);
            showNotification(error.message, 'error');
        }
    });
    
    // Handle form submission
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const confirmBtn = document.getElementById('confirmBtn');
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Creating event...';
            
            try {
                const eventDetails = getEventDetails();
                await createCalendarEvent(eventDetails);
                showNotification('Event created successfully!', 'success');
                
                // Close popup after 2 seconds
                setTimeout(() => window.close(), 2000);
                
            } catch (error) {
                console.error('Submit error:', error);
                showNotification(error.message, 'error');
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Confirm & Create';
            }
        });
    }
}

function getEventDetails() {
    console.log('Getting event details...');
    const title = document.getElementById('title')?.value?.trim();
    if (!title) {
        throw new Error('Event title is required');
    }
    
    const date = document.getElementById('date')?.value;
    if (!date) {
        throw new Error('Event date is required');
    }
    
    const time = document.getElementById('time')?.value;
    if (!time) {
        throw new Error('Event time is required');
    }
    
    return {
        title,
        date,
        time,
        description: document.getElementById('description')?.value?.trim() || '',
        recurring: document.getElementById('recurring')?.value || '',
        recurringEnd: document.getElementById('recurringEnd')?.value || ''
    };
}

function formatDateTime(date, time) {
    try {
        const dateObj = new Date(`${date}T${time}`);
        return dateObj.toLocaleString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        });
    } catch (error) {
        console.error('DateTime format error:', error);
        return 'Invalid date/time';
    }
}

function formatRecurrence(recurring, endDate) {
    if (!recurring) return 'One-time event';
    
    const frequency = recurring.toLowerCase();
    const until = endDate ? ` until ${new Date(endDate).toLocaleDateString()}` : '';
    return `Repeats ${frequency}${until}`;
}

function showNotification(message, type) {
    console.log(`Showing notification: ${type} - ${message}`);
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.classList.remove('hidden', 'success', 'error');
        notification.classList.add(type);
    }
}
