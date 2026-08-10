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

pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu", boldItalic="DejaVu-Bold")

styles = getSampleStyleSheet()
name_style = ParagraphStyle("Name", parent=styles["Normal"], fontName="DejaVu-Bold", fontSize=21, leading=23, textColor=INK, spaceAfter=2)
role_style = ParagraphStyle("Role", parent=styles["Normal"], fontName="DejaVu", fontSize=10, leading=12, textColor=MUTED, spaceAfter=5)
contact_style = ParagraphStyle("Contact", parent=styles["Normal"], fontName="DejaVu", fontSize=8, leading=10, textColor=MUTED, linkColor=LINK, spaceAfter=5)
availability_style = ParagraphStyle("Availability", parent=styles["Normal"], fontName="DejaVu-Bold", fontSize=8, leading=10, textColor=INK, borderColor=RULE, borderWidth=.6, borderPadding=(4, 6, 4, 6), spaceAfter=5)
section_style = ParagraphStyle("Section", parent=styles["Normal"], fontName="DejaVu-Bold", fontSize=7.8, leading=9.5, textColor=ACCENT, tracking=1.1, spaceBefore=6, spaceAfter=3.5)
body_style = ParagraphStyle("Body", parent=styles["Normal"], fontName="DejaVu", fontSize=8.35, leading=10.4, textColor=INK, alignment=TA_LEFT, spaceAfter=3, linkColor=LINK)
small_style = ParagraphStyle("Small", parent=body_style, fontSize=7.9, leading=9.8)
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
    topMargin=9 * mm,
    bottomMargin=8 * mm,
    title="Vaibhav Lalwani - AI Systems Engineer",
    author="Vaibhav Lalwani",
)

story = [
    Paragraph("Vaibhav Lalwani", name_style),
    Paragraph("AI Systems Engineer | MSc Advanced Data Science &amp; AI, University of Liverpool", role_style),
    Paragraph(
        "Liverpool, UK | +44 7544 537 860 | "
        "<a href='mailto:vaibhavlalwani26969@gmail.com'>vaibhavlalwani26969@gmail.com</a> | "
        "<a href='https://vaibhavlalwani.vercel.app'>Portfolio</a> | "
        "<a href='https://github.com/vaibhav4046'>GitHub</a> | "
        "<a href='https://linkedin.com/in/vaibhav-lalwani'>LinkedIn</a>",
        contact_style,
    ),
    Paragraph("Open to UK part-time AI/software roles and internships | Graduate roles from January 2027", availability_style),
    section("Profile"),
    Paragraph(
        "AI systems engineer building production LLM applications, retrieval pipelines and agent products end to end. "
        "Work spans evaluation, model orchestration, APIs, data, deployment and evidence-first interfaces. "
        "Shipped 20+ AI applications across product, academic and client contexts.",
        body_style,
    ),
    section("Skills"),
]

skills = [
    ("AI systems", "RAG, LLM evaluation, agents and tools, structured outputs, MCP, PyTorch, OpenAI, Anthropic, Gemini, Groq"),
    ("Engineering", "Python, TypeScript, JavaScript, FastAPI, Node.js, React, Next.js, REST APIs"),
    ("Data & ship", "Postgres, pgvector, Supabase, Redis, BullMQ, HydraDB, Docker, Vercel, GCP Cloud Run, GitHub Actions"),
]
skill_table = Table(
    [[Paragraph(label, label_style), Paragraph(value, small_style)] for label, value in skills],
    colWidths=[27 * mm, 154 * mm],
)
skill_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 1),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
]))
story.append(skill_table)
story.append(section("Experience"))
story.extend(role_row(
    "AI Engineer, Full-Stack | Meta Solution Technologies",
    "Apr - May 2026",
    "Remote, UK",
    [
        "Built features on Next.js 15, React 19 and TypeScript over a Python LLM backend with Postgres and pgvector.",
        "Delivered structured-output flows, Supabase OAuth/magic-link authentication, BullMQ/Redis background jobs and 10-language i18n.",
    ],
))
story.extend(role_row(
    "Software Engineer | Recruit Pilot",
    "Jan - Apr 2026",
    "Part-time, remote",
    ["Delivered React and TypeScript product features and fixes against a live REST API within a weekly review and release cadence."],
))
story.extend(role_row(
    "AI Engineer | Independent",
    "May 2024 - Jan 2026",
    "Remote",
    ["Built LLM applications and autonomous agents across SaaS, research and operations; owned data, backend, interface, deployment and hand-off."],
))

story.append(section("Selected work"))
projects = [
    ("HydraSentry", "HydraDB Build Blitz winner. Agent-memory integrity layer that checks provenance, blocks unsafe context and emits a signed review certificate.", "https://github.com/vaibhav4046/hydrasentry"),
    ("QueueProof", "Cross-source retrieval workspace with claim-level citations and inspectable evidence across connected work sources.", "https://github.com/vaibhav4046/queueproof"),
    ("Qyntra", "Wikithon 2026 finalist. Personal knowledge system combining grounded answers with a navigable 3D relationship map.", "https://github.com/vaibhav4046/qyntra-app"),
]
for name, description, url in projects:
    story.append(Paragraph(f"<b>{name}</b> - {description} <a href='{url}'>Source</a>", small_style))

story.extend([
    section("Research & education"),
    Paragraph(
        "<b>NEXUS</b> (2026), research preprint on on-controller transformer inference and speculative edge execution. "
        "<a href='https://doi.org/10.5281/zenodo.20059414'>DOI 10.5281/zenodo.20059414</a>",
        small_style,
    ),
])
education = Table([
    [Paragraph("<b>University of Liverpool</b><br/>MSc Advanced Data Science &amp; Artificial Intelligence", small_style), Paragraph("Jan 2026 - Jan 2027", small_style)],
    [Paragraph("<b>Christ University, Bengaluru</b><br/>Bachelor of Computer Applications", small_style), Paragraph("2022 - 2025", small_style)],
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

doc.build(story)
print(f"Built {OUTPUT.name}")
