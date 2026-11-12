import importlib.util
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Vaibhav_Lalwani_Resume.pdf"

INK = colors.HexColor("#111111")
MUTED = colors.HexColor("#5f6368")
RULE = colors.HexColor("#d9d9d6")
ACCENT = colors.HexColor("#d94f00")
LINK = colors.HexColor("#9f3a00")

def font_dirs() -> list[Path]:
    """DejaVu lives in system fonts on Linux and inside matplotlib's data dir elsewhere."""
    dirs = [Path("/usr/share/fonts/truetype/dejavu")]
    spec = importlib.util.find_spec("matplotlib")
    if spec is not None and spec.origin:
        dirs.append(Path(spec.origin).parent / "mpl-data" / "fonts" / "ttf")
    return dirs


def font_path(filename: str) -> str:
    for directory in font_dirs():
        candidate = directory / filename
        if candidate.is_file():
            return str(candidate)
    raise FileNotFoundError(f"DejaVu font not found: {filename}")


pdfmetrics.registerFont(TTFont("DejaVu", font_path("DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", font_path("DejaVuSans-Bold.ttf")))
pdfmetrics.registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu", boldItalic="DejaVu-Bold")

styles = getSampleStyleSheet()
name_style = ParagraphStyle("Name", parent=styles["Normal"], fontName="DejaVu-Bold", fontSize=21, leading=23, textColor=INK, spaceAfter=2)
role_style = ParagraphStyle("Role", parent=styles["Normal"], fontName="DejaVu", fontSize=10, leading=12, textColor=MUTED, spaceAfter=5)
contact_style = ParagraphStyle("Contact", parent=styles["Normal"], fontName="DejaVu", fontSize=8.3, leading=10.4, textColor=MUTED, linkColor=LINK, spaceAfter=5)
availability_style = ParagraphStyle("Availability", parent=styles["Normal"], fontName="DejaVu-Bold", fontSize=8.3, leading=10.4, textColor=INK, borderColor=RULE, borderWidth=.6, borderPadding=(4, 6, 4, 6), spaceAfter=5)
section_style = ParagraphStyle("Section", parent=styles["Normal"], fontName="DejaVu-Bold", fontSize=8.2, leading=10, textColor=ACCENT, tracking=1.1, spaceBefore=4.5, spaceAfter=2.5)
body_style = ParagraphStyle("Body", parent=styles["Normal"], fontName="DejaVu", fontSize=8.8, leading=10.6, textColor=INK, alignment=TA_LEFT, spaceAfter=3, linkColor=LINK)
small_style = ParagraphStyle("Small", parent=body_style, fontSize=8.1, leading=9.55)
label_style = ParagraphStyle("Label", parent=small_style, fontName="DejaVu-Bold", textColor=MUTED)


def section(text):
    return Paragraph(text.upper(), section_style)


def role_row(title, dates, meta, bullets):
    header = Table(
        [[Paragraph(f"<b>{title}</b>", body_style), Paragraph(dates, small_style)]],
        colWidths=[143 * mm, 38 * mm],
    )
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    items = [header, Paragraph(meta, small_style)]
    for bullet in bullets:
        items.append(Paragraph(f"<font color='#d94f00'>-</font>&nbsp; {bullet}", small_style))
    items.append(Spacer(1, 1.4))
    return items


doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=12 * mm,
    leftMargin=12 * mm,
    topMargin=8 * mm,
    bottomMargin=7 * mm,
    title="Vaibhav Lalwani - Applied AI Engineer (Python, LLM systems)",
    author="Vaibhav Lalwani",
)

story = [
    Paragraph("Vaibhav Lalwani", name_style),
    Paragraph("Applied AI Engineer (Python, LLM systems)", role_style),
    Paragraph(
        "Liverpool, UK | +44 7544 537 860 | "
        "<a href='mailto:vaibhavlalwani26969@gmail.com'>vaibhavlalwani26969@gmail.com</a> | "
        "<a href='https://vaibhavlalwani.vercel.app'>Portfolio</a> | "
        "<a href='https://github.com/vaibhav4046'>GitHub</a> | "
        "<a href='https://linkedin.com/in/vaibhav-lalwani'>LinkedIn</a>",
        contact_style,
    ),
    Paragraph("Student visa, moving to Graduate visa in early 2027 with full right to work. Eligible for the Skilled Worker new entrant rate.", availability_style),
    section("Summary"),
    Paragraph(
        "Applied AI engineer and MSc Advanced Data Science &amp; AI student at the University of Liverpool, building production LLM applications, "
        "retrieval pipelines and agent products end to end, with evaluation and verification treated as part of the build. "
        "2026 hackathon record includes the HydraDB x Connectors win (QueueProof) and the SharedOS Judges' Pick (Yuzu).",
        body_style,
    ),
    section("Professional Experience"),
]

story.extend(role_row(
    "Full-Stack / AI Engineer | Meta Solution Technologies",
    "Apr - May 2026",
    "Part-time, remote",
    [
        "Built an AI-guided admissions workflow using Next.js, React, TypeScript and Python-backed REST APIs; integrated Supabase authentication and PostgreSQL/pgvector retrieval.",
        "Implemented document-processing and email workflows using Redis/BullMQ; handled validation, failure states and multilingual interfaces.",
    ],
))
story.extend(role_row(
    "Software Engineer (Part-time) | Recruit Pilot",
    "Jan - Apr 2026",
    "Part-time, remote",
    ["Delivered React/TypeScript features and REST API integrations for a recruitment product, participating in code review and weekly release cycles."],
))
story.extend(role_row(
    "Coding Instructor | RoboCode UK",
    "Aug 2026 - Present",
    "Part-time, Liverpool, on-site",
    ["Completed instructor induction and onboarding; preparing Python and robotics lesson exercises and troubleshooting examples ahead of first class assignments."],
))
story.extend(role_row(
    "Front-End Developer Intern | Unified Mentor",
    "Mar - May 2025",
    "Remote",
    ["Built React features for a learner-facing platform, including lessons, progression views and REST-connected dashboards."],
))

story.append(section("Selected Engineering Projects"))
projects = [
    ("HydraSentry", "AI-agent memory security SaaS (FastAPI, Next.js)",
     "Built a multi-tenant FastAPI backend with Supabase magic-link auth, per-user API keys, rate limiting and an MCP gateway that blocks poisoned-memory actions; 237 pytest tests pass, CI on every push.",
     "https://github.com/vaibhav4046/hydrasentry"),
    ("Lacuna", "Provenance-first memory for AI agents",
     "Built temporal retrieval across web, CLI and MCP surfaces that abstains when evidence conflicts; 2,348 Vitest tests; includes a LongMemEval benchmark harness with recorded runs.",
     "https://github.com/vaibhav4046/lacuna"),
    ("QueueProof", "Cross-source evidence workspace",
     "Retrieval pipeline with claim-level citations, degraded-source handling and an approval boundary for external writes; 654 Vitest tests pass; evaluation fixtures, grading scripts and measured results are published in the repo.",
     "https://github.com/vaibhav4046/queueproof"),
    ("Kodro", "Offline-first robotics learning studio (Python)",
     "Pygame/Pymunk simulation app with Pydantic-validated models, an enforced 85% coverage gate and reproducible scenario evaluations committed as data.",
     "https://github.com/vaibhav4046/kodro"),
]
for name, tagline, description, url in projects:
    story.append(Paragraph(f"<b>{name}</b> | {tagline} &nbsp;<a href='{url}'>Source</a>", small_style))
    story.append(Paragraph(description, small_style))

story.extend([
    section("Selected Achievements"),
    Paragraph(
        "HydraDB x Connectors Winner (QueueProof) | SharedOS 2026 Judges' Pick (Yuzu) | HydraDB WikiThon Finalist (QyntraWiki Nexus) | Product Hunt #24 of the day (Kodro)",
        small_style,
    ),
    section("Education"),
])
education = Table([
    [Paragraph("<b>MSc Advanced Data Science &amp; Artificial Intelligence</b> | University of Liverpool", small_style), Paragraph("Expected Jan 2027", small_style)],
    [Paragraph("<b>BCA</b> | Christ University, Bengaluru", small_style), Paragraph("2022 - 2025", small_style)],
], colWidths=[143 * mm, 38 * mm])
education.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 1),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
]))
story.append(education)

story.append(section("Certifications"))
certs = [
    ("Artificial Intelligence on Microsoft Azure", "Microsoft, Coursera", "VYN3SU1H9I3Z"),
    ("Microsoft Azure Machine Learning", "Microsoft, Coursera", "H4BG7UI694TN"),
    ("Natural Language Processing in Microsoft Azure", "Microsoft, Coursera", "2W2FIN6EVBSL"),
    ("Computer Vision in Microsoft Azure", "Microsoft, Coursera", "OO1BFMY72ZDB"),
    ("Introduction to AI", "Google, Coursera", "ZDO3B89P0WKZ"),
]
for name, issuer, cert_id in certs:
    story.append(Paragraph(
        f"<b>{name}</b> ({issuer}) - certificate ID <a href='https://coursera.org/verify/{cert_id}'>{cert_id}</a>, Nov 2025",
        small_style,
    ))

story.extend([
    section("Technical Skills"),
    Paragraph(
        "<b>Languages:</b> Python, TypeScript, JavaScript, SQL",
        small_style,
    ),
    Paragraph(
        "<b>APIs and backend:</b> FastAPI, REST, Node.js, PostgreSQL, Supabase, Redis, BullMQ, Docker",
        small_style,
    ),
    Paragraph(
        "<b>AI engineering:</b> LLM APIs, RAG and retrieval evaluation, MCP servers, structured output validation with fallbacks, prompt/injection red-teaming",
        small_style,
    ),
    Paragraph(
        "<b>Experiment practice:</b> benchmark fixtures, logged and reproducible runs, error-handling and timeout paths, cost-conscious local-model evaluation, Git, GitHub Actions, pytest, Vitest",
        small_style,
    ),
])

doc.build(story)
print(f"Wrote {OUTPUT}")
