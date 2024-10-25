import os
import base64
import string
import json

def generate_extension_key():
    # Generate random bytes for the key
    random_bytes = os.urandom(32)
    key_base64 = base64.b64encode(random_bytes).decode('utf-8')
    
    # Generate a 32-character extension ID using only lowercase letters
    # We'll use the random bytes to generate indices into lowercase letters
    lowercase_letters = string.ascii_lowercase
    random_bytes_for_id = os.urandom(32)  # One byte per character
    extension_id = ''
    
    # Map each byte to a lowercase letter
    for byte in random_bytes_for_id:
        # Map the byte (0-255) to an index in lowercase_letters (0-25)
        index = byte % 26
        extension_id += lowercase_letters[index]
    
    # Read and update manifest.json
    manifest_content = {
        "manifest_version": 3,
        "name": "Calendar Event Creator",
        "version": "1.0",
        "description": "Create Google Calendar events from web pages",
        "key": key_base64,
        "permissions": [
            "activeTab",
            "identity",
            "tabs"
        ],
        "host_permissions": [
            "https://www.googleapis.com/*"
        ],
        "action": {
            "default_popup": "popup/popup.html",
            "default_icon": {
                "48": "assets/icon.svg",
                "128": "assets/icon.svg"
            }
        },
        "background": {
            "service_worker": "background/background.js"
        },
        "oauth2": {
            "client_id": "828541577236-2vlknoonm9sgo5usu8o17mckm7c83gj9.apps.googleusercontent.com",
            "scopes": [
                "https://www.googleapis.com/auth/calendar.events"
            ]
        },
        "icons": {
            "48": "assets/icon.svg",
            "128": "assets/icon.svg"
        }
    }
    
    with open('manifest.json', 'w') as f:
        json.dump(manifest_content, f, indent=2)
    
    print(f"Extension ID: {extension_id}")

if __name__ == "__main__":
    generate_extension_key()
