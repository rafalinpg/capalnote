import requests
import json

BASE_URL = "http://localhost:8000/api"

def login():
    response = requests.post(f"{BASE_URL}/token/", json={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json()['access']
    else:
        print("Login failed:", response.text)
        return None

def test_update():
    token = login()
    if not token:
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 1. Create Note
    print("\n--- Creating Note ---")
    create_payload = {
        "notebook": 1, # Assuming notebook 1 exists, or we might need to create one
        "title": "Test Note",
        "content_rich": "<p>Initial content</p>",
        "content_text": "Initial content"
    }
    
    # First get notebooks to find a valid one
    nb_res = requests.get(f"{BASE_URL}/notebooks/", headers=headers)
    if nb_res.status_code == 200 and len(nb_res.json()) > 0:
        notebook_id = nb_res.json()[0]['id']
        create_payload['notebook'] = notebook_id
    else:
        # Create notebook
        nb_res = requests.post(f"{BASE_URL}/notebooks/", headers=headers, json={"name": "Test Notebook"})
        if nb_res.status_code == 201:
            notebook_id = nb_res.json()['id']
            create_payload['notebook'] = notebook_id
        else:
            print("Failed to get/create notebook")
            return

    res = requests.post(f"{BASE_URL}/notes/", headers=headers, json=create_payload)
    if res.status_code != 201:
        print("Failed to create note:", res.text)
        return
    
    note = res.json()
    note_id = note['id']
    print(f"Note created: {note_id}")

    # 2. Update Note with tag_ids
    print("\n--- Updating Note with tag_ids ---")
    # Get a tag
    tags_res = requests.get(f"{BASE_URL}/tags/", headers=headers)
    tag_id = None
    if tags_res.status_code == 200 and len(tags_res.json()) > 0:
        tag_id = tags_res.json()[0]['id']
    else:
        # Create tag
        t_res = requests.post(f"{BASE_URL}/tags/", headers=headers, json={"name": "Test Tag", "color": "#ff0000"})
        if t_res.status_code == 201:
            tag_id = t_res.json()['id']
    
    if tag_id:
        update_payload = {
            "tag_ids": [tag_id]
        }
        res = requests.patch(f"{BASE_URL}/notes/{note_id}/", headers=headers, json=update_payload)
        print(f"Update tags response ({res.status_code}):", res.text[:200])
    
    # 3. Update Note with content
    print("\n--- Updating Note content ---")
    update_payload = {
        "content_rich": "<p>Updated content</p>",
        "content_text": "Updated content"
    }
    res = requests.patch(f"{BASE_URL}/notes/{note_id}/", headers=headers, json=update_payload)
    print(f"Update content response ({res.status_code}):", res.text)

    # 4. Update with empty title (Simulate failure)
    print("\n--- Updating with empty title ---")
    update_payload = {
        "title": ""
    }
    res = requests.patch(f"{BASE_URL}/notes/{note_id}/", headers=headers, json=update_payload)
    print(f"Update empty title response ({res.status_code}):", res.text)

    # 5. Update with empty tag_ids
    print("\n--- Updating with empty tag_ids ---")
    update_payload = {
        "tag_ids": []
    }
    res = requests.patch(f"{BASE_URL}/notes/{note_id}/", headers=headers, json=update_payload)
    print(f"Update empty tags response ({res.status_code}):", res.text)

    # Clean up
    requests.delete(f"{BASE_URL}/notes/{note_id}/", headers=headers)

if __name__ == "__main__":
    test_update()
