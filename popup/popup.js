document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    initializePopup().catch(error => {
        console.error('Initialization error:', error);
        showNotification(error.message, 'error');
    });
});

async function getCurrentTab() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
            throw new Error('No active tab found');
        }
        return tabs[0];
    } catch (error) {
        console.error('Tab query error:', error);
        throw new Error('Failed to access current tab information');
    }
}

async function initializePopup() {
    try {
        // Get DOM elements
        const elements = {
            title: document.getElementById('title'),
            description: document.getElementById('description'),
            date: document.getElementById('date'),
            time: document.getElementById('time'),
            recurring: document.getElementById('recurring'),
            recurringEnd: document.getElementById('recurringEnd'),
            previewBtn: document.getElementById('previewBtn'),
            editBtn: document.getElementById('editBtn'),
            previewSection: document.getElementById('previewSection'),
            formGroups: document.querySelectorAll('.form-group'),
            notification: document.getElementById('notification')
        };

        // Validate required elements
        Object.entries(elements).forEach(([key, element]) => {
            if (!element && key !== 'recurringEnd') {
                throw new Error(`Required element "${key}" not found`);
            }
        });

        // Get current tab and pre-fill form
        const tab = await getCurrentTab();
        elements.title.value = tab.title || '';
        elements.description.value = tab.url ? `Source: ${tab.url}` : '';

        // Set default date and time
        const now = new Date();
        elements.date.value = now.toISOString().split('T')[0];
        elements.time.value = now.toTimeString().slice(0, 5);

        setupEventHandlers(elements);

    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize: ' + error.message, 'error');
    }
}

function setupEventHandlers(elements) {
    console.log('Setting up event handlers...');

    // Handle recurring event selection
    if (elements.recurring && elements.recurringEnd) {
        elements.recurring.addEventListener('change', () => handleRecurringChange(elements));
    }

    // Preview button handler
    elements.previewBtn.addEventListener('click', async () => {
        await handlePreviewClick(elements);
    });

    // Edit button handler
    elements.editBtn.addEventListener('click', () => {
        handleEditClick(elements);
    });

    // Form submission handler
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            await handleFormSubmit(e, elements);
        });
    }
}

async function handlePreviewClick(elements) {
    console.log('Preview button clicked');
    try {
        // Add loading state
        setButtonState(elements.previewBtn, true, 'Preparing preview...');

        // Validate form data
        const eventDetails = await validateAndGetEventDetails();
        console.log('Event details:', eventDetails);

        // Update preview content
        updatePreviewContent(eventDetails, elements);

        // Show preview section with smooth transition
        await transitionToPreview(elements);

    } catch (error) {
        console.error('Preview error:', error);
        showNotification(error.message, 'error');
    } finally {
        // Reset button state
        setButtonState(elements.previewBtn, false, 'Preview Event');
    }
}

async function validateAndGetEventDetails() {
    const formData = {
        title: document.getElementById('title')?.value?.trim(),
        date: document.getElementById('date')?.value,
        time: document.getElementById('time')?.value,
        description: document.getElementById('description')?.value?.trim() || '',
        recurring: document.getElementById('recurring')?.value || '',
        recurringEnd: document.getElementById('recurringEnd')?.value || ''
    };

    // Validate required fields
    if (!formData.title) throw new Error('Event title is required');
    if (!formData.date) throw new Error('Event date is required');
    if (!formData.time) throw new Error('Event time is required');

    // Validate date and time
    const eventDate = new Date(`${formData.date}T${formData.time}`);
    if (isNaN(eventDate.getTime())) {
        throw new Error('Invalid date or time format');
    }

    // Validate recurring end date if recurring is selected
    if (formData.recurring && formData.recurringEnd) {
        const endDate = new Date(formData.recurringEnd);
        if (isNaN(endDate.getTime())) {
            throw new Error('Invalid recurring end date');
        }
        if (endDate < eventDate) {
            throw new Error('Recurring end date must be after event start date');
        }
    }

    return formData;
}

function updatePreviewContent(eventDetails, elements) {
    document.getElementById('previewTitle').textContent = eventDetails.title;
    document.getElementById('previewDateTime').textContent = 
        formatDateTime(eventDetails.date, eventDetails.time);
    document.getElementById('previewDescription').textContent = 
        eventDetails.description || 'No description';
    document.getElementById('previewRecurrence').textContent = 
        formatRecurrence(eventDetails.recurring, eventDetails.recurringEnd);
}

async function transitionToPreview(elements) {
    elements.previewSection.style.opacity = '0';
    elements.previewSection.classList.remove('hidden');

    // Use Promise to handle transition timing
    await new Promise(resolve => {
        setTimeout(() => {
            elements.previewSection.style.opacity = '1';
            elements.previewBtn.classList.add('hidden');

            // Hide form groups with smooth transition
            elements.formGroups.forEach(group => {
                group.style.opacity = '0';
                setTimeout(() => {
                    group.style.display = 'none';
                }, 300);
            });
            resolve();
        }, 50);
    });
}

function handleEditClick(elements) {
    console.log('Edit button clicked');
    try {
        // Hide preview section with smooth transition
        elements.previewSection.style.opacity = '0';
        setTimeout(() => {
            elements.previewSection.classList.add('hidden');
            elements.previewBtn.classList.remove('hidden');

            // Show form groups with smooth transition
            elements.formGroups.forEach(group => {
                if (group.id === 'recurringEndGroup') {
                    group.style.display = elements.recurring.value ? 'flex' : 'none';
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
}

async function handleFormSubmit(e, elements) {
    e.preventDefault();
    const confirmBtn = document.getElementById('confirmBtn');

    try {
        setButtonState(confirmBtn, true, 'Creating event...');
        const eventDetails = await validateAndGetEventDetails();
        await createCalendarEvent(eventDetails);
        
        showNotification('Event created successfully!', 'success');
        setTimeout(() => window.close(), 2000);

    } catch (error) {
        console.error('Submit error:', error);
        showNotification(error.message, 'error');
    } finally {
        setButtonState(confirmBtn, false, 'Confirm & Create');
    }
}

function handleRecurringChange(elements) {
    const recurringEndGroup = document.getElementById('recurringEndGroup');
    recurringEndGroup.style.display = elements.recurring.value ? 'flex' : 'none';
    
    if (elements.recurring.value) {
        const endDate = new Date(elements.date.value);
        endDate.setMonth(endDate.getMonth() + 1);
        elements.recurringEnd.value = endDate.toISOString().split('T')[0];
    }
}

function setButtonState(button, loading, text) {
    if (button) {
        button.disabled = loading;
        button.textContent = text;
    }
}

function formatDateTime(date, time) {
    try {
        const dateObj = new Date(`${date}T${time}`);
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date/time');
        }
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
