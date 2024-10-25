chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Extension installed');
    }
});

// Handle any background tasks or authentication refreshing if needed
chrome.identity.onSignInChanged.addListener((account, signedIn) => {
    if (!signedIn) {
        // Handle sign-out if needed
        console.log('User signed out');
    }
});

// Add function to clear auth tokens
function clearAuthToken() {
    chrome.identity.getAuthToken({ interactive: false }, function(token) {
        if (token) {
            // Revoke token
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
                .then(() => {
                    // Remove token from Chrome's cache
                    chrome.identity.removeCachedAuthToken({ token: token }, function() {
                        console.log('Token cleared');
                    });
                });
        }
    });
}

// Listen for extension removal
chrome.runtime.setUninstallURL('', () => {
    clearAuthToken();
});
