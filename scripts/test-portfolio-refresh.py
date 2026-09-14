from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
index = (ROOT / "index.html").read_text(encoding="utf-8")
work = (ROOT / "work.html").read_text(encoding="utf-8")
style = (ROOT / "style.css").read_text(encoding="utf-8")

required_index = [
    "id=\"latest\"",
    "Yuzu",
    "SharedOS Hackathon",
    "Judges’ Pick",
    "VYREALM",
    "ReqKeeper",
    "VIVA",
    "4×",
    "RocketRide × SCU Buildathon · Winner",
    "https://yuzu-market.vercel.app/",
    "https://github.com/vaibhav4046/yuzu",
    "https://github.com/vaibhav4046/VYREALM",
    "https://reqkeeper.vercel.app",
    "https://github.com/vaibhav4046/reqkeeper",
    "https://viva-five-murex.vercel.app",
    "https://github.com/vaibhav4046/viva",
]
required_work = [
    "37 builds",
    "Yuzu",
    "VYREALM",
    "ReqKeeper",
    "VIVA",
    "Judges’ Pick",
]
required_style = [".latest-grid", ".latest-hero", ".latest-card", ".win-chip"]

missing = []
for needle in required_index:
    if needle not in index:
        missing.append(f"index.html missing: {needle}")
for needle in required_work:
    if needle not in work:
        missing.append(f"work.html missing: {needle}")
for needle in required_style:
    if needle not in style:
        missing.append(f"style.css missing: {needle}")

# Winner-only means no new prize valuation language on the refreshed surfaces.
latest_slice = index[index.find('id="latest"'):index.find('<!-- ===== Selected work ===== -->')]
for forbidden in ["$100", "$1,000", "$500", "prize pool", "cash prize", "SharedOS Credits"]:
    if forbidden.lower() in latest_slice.lower():
        missing.append(f"latest section contains forbidden prize wording: {forbidden}")

class StrictEnoughHTMLParser(HTMLParser):
    def error(self, message):
        raise AssertionError(message)

for name, doc in [("index.html", index), ("work.html", work)]:
    parser = StrictEnoughHTMLParser(convert_charrefs=True)
    try:
        parser.feed(doc)
        parser.close()
    except Exception as exc:
        missing.append(f"{name} HTML parse error: {exc}")

if missing:
    raise SystemExit("portfolio refresh checks: FAIL\n" + "\n".join(f"- {item}" for item in missing))

print("portfolio refresh checks: PASS")
