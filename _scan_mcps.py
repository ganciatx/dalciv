#!/usr/bin/env python3
import os
import json

root = "/Users/jacksonechols/.cursor/projects/Users-jacksonechols-Desktop-Sivic-Scraper/mcps"
out_path = "/Users/jacksonechols/Desktop/Sivic Scraper/_mcp_scan_result.json"

result = {
    "root_exists": os.path.exists(root),
    "servers": [],
    "auth_files": [],
    "vps_paths": [],
}

if os.path.exists(root):
    for name in sorted(os.listdir(root)):
        p = os.path.join(root, name)
        server = {"name": name, "path": p, "is_dir": os.path.isdir(p), "files": []}
        if os.path.isdir(p):
            for dirpath, dirnames, filenames in os.walk(p):
                for f in sorted(filenames):
                    fp = os.path.join(dirpath, f)
                    rel = os.path.relpath(fp, root)
                    entry = {"rel": rel, "abs": fp, "size": os.path.getsize(fp)}
                    server["files"].append(entry)
                    low = f.lower()
                    if "auth" in low:
                        result["auth_files"].append(entry)
                    if "vps" in low or "vps" in rel.lower():
                        result["vps_paths"].append(entry)
        result["servers"].append(server)

with open(out_path, "w") as fh:
    json.dump(result, fh, indent=2)

print(out_path)
