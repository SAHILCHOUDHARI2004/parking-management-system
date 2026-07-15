"""Import the supplied Alpatech inventory workbook through the protected API."""
import os
import pandas as pd
import json
from urllib import request

WORKBOOK = os.environ.get("PARKING_INVENTORY_FILE", r"C:\Users\Raj\Downloads\Parking inventory Data-Alpatech (1) (2).xlsx")
API = os.environ.get("PMS_API_URL", "http://127.0.0.1:5000")
USERNAME = os.environ.get("PMS_IMPORT_USERNAME")
PASSWORD = os.environ.get("PMS_IMPORT_PASSWORD")
if not USERNAME or not PASSWORD:
    raise RuntimeError("Set PMS_IMPORT_USERNAME and PMS_IMPORT_PASSWORD before running this import.")

data = pd.read_excel(WORKBOOK, sheet_name="Parking Data")
data = data.dropna(subset=["Slot Number "])
slots = []
for _, row in data.iterrows():
    slots.append({
        "basement": str(row["Basement"]).strip(),
        "slot_number": str(row["Slot Number "]).strip(),
        "vehicle_type": str(row["Vehicle Slot type "]).strip(),
        "parking_type": str(row["Parking Type Puzzle /Stack/Ground"]).strip(),
        "allocation_type": str(row["Allocation "]).strip(),
        "camera_number": str(row["Camera Number"]).strip(),
        "puzzle_number": str(row["Puzzle Number"]).strip(),
        "height": str(row["Height"]).strip(),
        "status": "Available",
    })

credentials = f"username={USERNAME}&password={PASSWORD}".encode()
login_request = request.Request(f"{API}/api/auth/login", data=credentials, headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
with request.urlopen(login_request, timeout=30) as response:
    token = json.load(response)["access_token"]
payload = json.dumps({"slots": slots}).encode()
import_request = request.Request(f"{API}/api/parking-slots/bulk-import", data=payload, headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}, method="POST")
with request.urlopen(import_request, timeout=120) as response:
    print(json.load(response))
