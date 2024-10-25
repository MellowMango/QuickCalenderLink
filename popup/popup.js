document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = await getAuthTokenSilent();
        
        if (token) {
            toggleAuthState(true);
        } else {
            toggleAuthState(false);
        }
    } catch (error) {
        console.error('Silent auth failed:', error);
        toggleAuthState(false);
    }

    // Get current tab information
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Pre-fill form with page title and URL
    document.getElementById('title').value = tab.title;
    document.getElementById('description').value = `Source: ${tab.url}`;
    
    // Set default date and time
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));
    
    document.getElementById('date').value = now.toISOString().split('T')[0];
    document.getElementById('time').value = now.toTimeString().slice(0, 5);
    document.getElementById('endTime').value = oneHourLater.toTimeString().slice(0, 5);
    document.getElementById('endDate').value = now.toISOString().split('T')[0];
    
    // Time validation
    document.getElementById('time').addEventListener('change', validateTimeRange);
    document.getElementById('endTime').addEventListener('change', validateTimeRange);
    
    function validateTimeRange() {
        const startTime = document.getElementById('time').value;
        const endTime = document.getElementById('endTime').value;
        const startDate = document.getElementById('date').value;
        const endDate = document.getElementById('endDate').value;
        
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(`${endDate}T${endTime}`);
        
        if (end <= start) {
            document.getElementById('endTime').setCustomValidity('End time must be after start time');
        } else {
            document.getElementById('endTime').setCustomValidity('');
        }
    }
    
    // Set default end date to the same as start date
    document.getElementById('date').addEventListener('change', () => {
        document.getElementById('endDate').value = document.getElementById('date').value;
    });
    
    // Toggle end date input visibility
    document.getElementById('differentEndDate').addEventListener('change', () => {
        const endDateGroup = document.getElementById('endDateGroup');
        if (document.getElementById('differentEndDate').checked) {
            endDateGroup.style.display = 'block';
        } else {
            endDateGroup.style.display = 'none';
            document.getElementById('endDate').value = document.getElementById('date').value;
        }
    });
    
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
                endDate: document.getElementById('endDate').value,
                endTime: document.getElementById('endTime').value,
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

async function getAuthTokenSilent() {
    try {
        const token = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ 
                interactive: false,
                scopes: [
                    'https://www.googleapis.com/auth/calendar.events',
                    'https://www.googleapis.com/auth/calendar'
                ]
            }, function(token) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(token);
                }
            });
        });
        return token;
    } catch (error) {
        console.error('Silent auth error:', error);
        throw error;
    }
}

function toggleAuthState(isAuthenticated) {
    if (isAuthenticated) {
        document.getElementById('authenticateButton').style.display = 'none';
        document.getElementById('eventForm').style.display = 'block';
        document.getElementById('signOutButton').style.display = 'block';
    } else {
        document.getElementById('authenticateButton').style.display = 'block';
        document.getElementById('eventForm').style.display = 'none';
        document.getElementById('signOutButton').style.display = 'none';
    }
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden', 'success', 'error');
    notification.classList.add(type);
}

async function authenticate() {
    try {
        const token = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, function(token) {
                if (chrome.runtime.lastError || !token) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(token);
                }
            });
        });
        console.log('Authenticated with token:', token);
        toggleAuthState(true);
        showNotification('Signed in successfully', 'success');
        setTimeout(() => {
            const notification = document.getElementById('notification');
            notification.classList.add('hidden');
        }, 5000);
        return token;
    } catch (error) {
        console.error('Error during authentication:', error);
        showNotification('Authentication failed. Please try again.', 'error');
    }
}

document.getElementById('authenticateButton').addEventListener('click', authenticate);

document.getElementById('signOutButton').addEventListener('click', async () => {
    try {
        await removeToken();
        toggleAuthState(false);
        showNotification('Signed out successfully', 'success');
        setTimeout(() => {
            const notification = document.getElementById('notification');
            notification.classList.add('hidden');
        }, 5000);
    } catch (error) {
        showNotification('Error signing out: ' + error.message, 'error');
    }
});
