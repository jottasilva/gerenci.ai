import requests
import json

url = "http://localhost:8000/api/auth/session-token/"
headers = {
    "X-Internal-Secret": "n8n999",
    "Content-Type": "application/json"
}
data = {
    "whatsapp": "43991359790"
}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
