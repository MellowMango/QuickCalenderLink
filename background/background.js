chrome.runtime.onInstalled.addListener(() => {
    // Initialize extension
    console.log('Calendar Event Creator extension installed');
});

// Handle any background tasks or authentication refreshing if needed
chrome.identity.onSignInChanged.addListener((account, signedIn) => {
    if (!signedIn) {
        // Handle sign-out if needed
        console.log('User signed out');
    }
});
