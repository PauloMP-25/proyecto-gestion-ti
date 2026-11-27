import os, re

services_dir = "c:/Users/Fabrizio/Documents/GitHub/proyecto-gestion-ti/frontend/src/app"
for root, dirs, files in os.walk(services_dir):
    for file in files:
        if file.endswith(".ts"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                matches = re.findall(r"['\"`]/api/[^'\"`]+['\"`]", content)
                for m in matches:
                    print(file, m)
