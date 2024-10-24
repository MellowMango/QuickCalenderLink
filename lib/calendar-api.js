async function createCalendarEvent(eventDetails) {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Failed to get authentication token. Please ensure you are signed in to your Google account.');
        }
        
        const startDateTime = new Date(`${eventDetails.date}T${eventDetails.time}`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration
        
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

        // Add recurrence rule if recurring is selected
        if (eventDetails.recurring) {
            let recurrenceRule = `RRULE:FREQ=${eventDetails.recurring}`;
            
            // Add end date if specified
            if (eventDetails.recurringEnd) {
                const endDate = new Date(eventDetails.recurringEnd);
                endDate.setDate(endDate.getDate() + 1); // Include the end date
                recurrenceRule += `;UNTIL=${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
            }
            
            event.recurrence = [recurrenceRule];
        }
        
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
            throw new Error(errorData.error?.message || 'Failed to create calendar event');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Calendar API Error:', error);
        if (error.message.includes('OAuth2')) {
            throw new Error('Authentication error: Please sign in to your Google account and try again.');
        } else if (error.message.includes('token')) {
            throw new Error('Authorization error: Please ensure you have granted calendar access permissions.');
        } else {
            throw new Error(`Failed to create event: ${error.message}`);
        }
    }
}

async function getAuthToken() {
    try {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
                if (chrome.runtime.lastError) {
                    console.error('Auth Error:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                if (!token) {
                    reject(new Error('Failed to obtain authentication token'));
                    return;
                }
                resolve(token);
            });
        });
    } catch (error) {
        console.error('Authentication Error:', error);
        throw new Error(`Authentication failed: ${error.message}`);
    }
}
