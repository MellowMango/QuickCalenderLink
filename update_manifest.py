import os
import json

def update_manifest():
    # Read the current manifest
    with open('manifest.json', 'r') as f:
        manifest = json.load(f)
    
    # Get the client ID from environment
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    if not client_id:
        raise ValueError("GOOGLE_CLIENT_ID environment variable is not set")
    
    # Update the client_id in the manifest
    manifest['oauth2']['client_id'] = client_id
    
    # Write the updated manifest
    with open('manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2)

if __name__ == "__main__":
    update_manifest()
