import os
import json

def scan_project(root_dir):
    stats = {'py': 0, 'ts': 0, 'tsx': 0, 'cs': 0}
    files_list = []
    
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in root or '.venv' in root or '.git' in root or '__pycache__' in root:
            continue
        for file in files:
            ext = file.split('.')[-1] if '.' in file else ''
            if ext in stats:
                stats[ext] += 1
            files_list.append(os.path.join(root, file))
            
    print('Total Files:', len(files_list))
    print('Stats:', json.dumps(stats, indent=2))

scan_project('c:/Users/lenovo/OneDrive/Desktop/META GO')
