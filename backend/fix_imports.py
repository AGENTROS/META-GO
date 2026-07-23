import glob
import re

for filename in glob.glob("*.py"):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace 'from .something import ...' with 'from something import ...'
    # Only if it's at the start of the line or has whitespace before it
    new_content = re.sub(
        r"(\n|^)([ \t]*)from \.([a-zA-Z0-9_]+) import", r"\1\2from \3 import", content
    )

    if new_content != content:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Fixed imports in {filename}")
