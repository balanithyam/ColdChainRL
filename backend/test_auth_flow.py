import json
import urllib.request
import urllib.error

base_url = "http://127.0.0.1:8000/api"

# 1. Login
login_data = json.dumps({"email": "operator@coldchain.ai", "password": "Password123!"}).encode("utf-8")
req = urllib.request.Request(f"{base_url}/auth/login", data=login_data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as response:
        res_json = json.loads(response.read().decode())
        print("Login OK. User:", res_json.get("user", {}).get("email"))
        token = res_json.get("access_token")
except urllib.error.HTTPError as e:
    print("Login Error:", e.code, e.read().decode())
    token = None

if token:
    # 2. Test /auth/me
    req_me = urllib.request.Request(f"{base_url}/auth/me", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req_me) as response:
            print("/auth/me OK:", response.read().decode())
    except urllib.error.HTTPError as e:
        print("/auth/me Error:", e.code, e.read().decode())

    # 3. Test /units/
    req_units = urllib.request.Request(f"{base_url}/units/", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req_units) as response:
            print("/units/ OK. Count:", len(json.loads(response.read().decode())))
    except urllib.error.HTTPError as e:
        print("/units/ Error:", e.code, e.read().decode())

    # 4. Test /units without trailing slash
    req_units_no_slash = urllib.request.Request(f"{base_url}/units", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req_units_no_slash) as response:
            print("/units (no slash) OK. Count:", len(json.loads(response.read().decode())))
    except urllib.error.HTTPError as e:
        print("/units (no slash) Error:", e.code, e.read().decode())
