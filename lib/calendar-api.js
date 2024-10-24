async function createCalendarEvent(eventDetails) {
    try {
        const token = await getAuthToken();
        
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
            throw new Error('Failed to create calendar event');
        }
        
        return await response.json();
    } catch (error) {
        throw new Error('Error creating event: ' + error.message);
    }
}

async function getAuthToken() {
    try {
        return await chrome.identity.getAuthToken({ interactive: true });
    } catch (error) {
        throw new Error('Authentication failed');
    }
}
