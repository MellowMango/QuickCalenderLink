async function createCalendarEvent(eventDetails) {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('No authentication token available');
        }
        
        const startDateTime = new Date(`${eventDetails.date}T${eventDetails.time}`);
        const endDateTime = new Date(`${eventDetails.endDate || eventDetails.date}T${eventDetails.endTime}`);
        
        // Validate time range
        if (endDateTime <= startDateTime) {
            throw new Error('End time must be after start time');
        }
        
        const event = {
            'summary': eventDetails.title,
            'description': eventDetails.description,
            'start': {
                'dateTime': startDateTime.toISOString(),
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            'end': {
                'dateTime': endDateTime.toISOString(),
                'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
        
        console.log('Creating event:', event);
        
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Response Error:', errorData);
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const responseData = await response.json();
        console.log('Event created:', responseData);
        return responseData;
    } catch (error) {
        console.error('Calendar API Error:', error);
        throw error; // Throw the original error for better debugging
    }
}

async function getAuthToken() {
    try {
        const auth = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ 
                interactive: true,
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
        
        return auth; // This returns just the token string, not an object
    } catch (error) {
        console.error('Auth Error:', error);
        throw new Error('Authentication failed: ' + error.message);
    }
}

async function removeToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: false }, function(current_token) {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }

            if (!current_token) {
                console.warn('No token found to revoke.');
                resolve();
                return;
            }

            // Revoke the token
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${current_token}`)
                .then(response => {
                    if (response.ok) {
                        // Remove the token from Chrome's cache
                        chrome.identity.removeCachedAuthToken({ token: current_token }, function() {
                            if (chrome.runtime.lastError) {
                                reject(new Error(chrome.runtime.lastError.message));
                            } else {
                                console.log('Token successfully revoked and removed from cache.');
                                resolve();
                            }
                        });
                    } else {
                        reject(new Error('Failed to revoke token.'));
                    }
                })
                .catch(error => {
                    reject(new Error(`Token revocation failed: ${error.message}`));
                });
        });
    });
}
