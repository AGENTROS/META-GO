import os
import re

directory = 'src/components/dashboard/modules'
target_string = "const dummyAddress = '0x89C54F1023aB9E71a';"
import_string = "import { useAccount } from 'wagmi';\n"

for filename in os.listdir(directory):
    if not filename.endswith('.tsx'): continue
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if target_string in content or 'const dummyAddress =' in content:
        # Check if wagmi is imported
        if 'useAccount' not in content:
            # Insert import after 'lucide-react' or 'react'
            content = re.sub(r"(import .* from 'react';\n)", r"\1" + import_string, content)
            
        # Replace dummyAddress definition
        replacement = "const { address } = useAccount();\n  const dummyAddress = address;"
        content = re.sub(r"const dummyAddress\s*=\s*'0x89C54F1023aB9E71a'\s*;", replacement, content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Patched {filename}')

# Also fix app/dashboard/page.tsx
page_path = 'src/app/dashboard/page.tsx'
with open(page_path, 'r', encoding='utf-8') as f:
    page_content = f.read()
if 'const dummyAddress' in page_content:
    if 'useAccount' not in page_content:
        page_content = re.sub(r"(import .* from 'react';\n)", r"\1" + import_string, page_content)
    replacement = "const { address } = useAccount();\n  const dummyAddress = address;"
    page_content = re.sub(r"const dummyAddress\s*=\s*'0x89C54F1023aB9E71a'\s*;", replacement, page_content)
    with open(page_path, 'w', encoding='utf-8') as f:
        f.write(page_content)
    print('Patched dashboard/page.tsx')
