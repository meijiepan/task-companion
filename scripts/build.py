from pathlib import Path
import json
import shutil

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
if dist.exists():
    shutil.rmtree(dist)
(dist / "server").mkdir(parents=True)
(dist / ".openai").mkdir()
source = (root / "worker" / "index.js").read_text()
page = (root / "worker" / "page.html").read_text()
assert source.count("__PAGE__") == 2  # comment and expression
source = source.replace("const PAGE = __PAGE__;", "const PAGE = " + json.dumps(page, ensure_ascii=False) + ";")
(dist / "server" / "index.js").write_text(source)
shutil.copy2(root / ".openai" / "hosting.json", dist / ".openai" / "hosting.json")
print("Built", dist)
