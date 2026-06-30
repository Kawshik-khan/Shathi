"""Trigger /api/v1/auth/register, surface full traceback via JSON."""
import json, urllib.request, urllib.error, traceback

BODY = json.dumps({"email":"trace+after-ca@example.com","password":"smokesecret","name":"Trace"}).encode()

req = urllib.request.Request(
    "http://127.0.0.1:8001/api/v1/auth/register",
    data=BODY,
    headers={"Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(req, timeout=12) as r:
        print(r.status, r.read().decode()[:400])
except urllib.error.HTTPError as e:
    print(e.code, e.read().decode()[:400])