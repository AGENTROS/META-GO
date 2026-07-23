import glob
import re
import os

for filename in glob.glob("tests/*.py"):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace 'from backend.xyz import abc' with 'from xyz import abc'
    content = re.sub(r"from backend\.", r"from ", content)
    # Replace 'import backend.xyz' with 'import xyz'
    content = re.sub(r"import backend\.", r"import ", content)
    # Replace 'from backend import xyz' with 'import xyz'
    content = re.sub(r"from backend import ", r"import ", content)
    # Replace 'backend.xyz' with 'xyz' (e.g., backend.relayer.IS_EPHEMERAL)
    content = re.sub(r"backend\.", r"", content)

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {filename}")
