"""Render docs/skills-review.md: every skill with its levels, for human review."""
import json
from pathlib import Path

here = Path(__file__).parent
tree = json.loads((here / "skills.json").read_text())
lv = {str(l["level"]): l for l in json.loads((here / "levels.json").read_text())["levels"]}
out = ["# Speaker-to-Machines: skills and level descriptions (review copy)", "",
       "Generated from data/skills.json by data/render_review.py. Do not edit here.", ""]
for cat, subs in tree.items():
    out += [f"## {cat}", ""]
    for sub, skills in subs.items():
        for name, s in skills.items():
            lo, hi = s["level_range"]
            out += [f"### {s['code']} {name} (levels {lo}-{hi})", "", s["description"], ""]
            if s["levels"]:
                for k, text in s["levels"].items():
                    out.append(f"- {k} {lv[k]['title']}: {text}")
            else:
                out.append("- Level descriptions not yet written.")
            ex = s["examples"]["items"]
            if ex:
                out += ["", f"Examples ({s['examples']['as_of']}): " + ", ".join(ex)]
            out.append("")
(here.parent / "docs" / "skills-review.md").write_text("\n".join(out))
print("written")
