import os, re

frontend_dir = "c:/Users/Fabrizio/Documents/GitHub/proyecto-gestion-ti/frontend"
api_paths = set()

for root, dirs, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith(".ts"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                matches = re.findall(r"['\"`]/api/[^'\"`]+['\"`]", content)
                for m in matches:
                    api_paths.add(m)

for p in sorted(api_paths):
    print(p)
