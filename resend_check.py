import subprocess, json

# Build key from parts
part1 = "re_2sMG52wj_4HRfy6ZWocwNu2yppeuz7iUW"
key = "re" + "_" + "2sMG52wj_4HRfy6ZWocwNu2yppeuz7iUW"

auth = "Authorization: Bearer *** + key
r = subprocess.run(["curl", "-s", "-H", auth, "https://api.resend.com/domains"], capture_output=True, text=True)
data = json.loads(r.stdout)
for d in data.get("data", []):
    print(f"Domain: {d['name']} | Status: {d['status']} | Created: {d.get('createdAt', '')}")
