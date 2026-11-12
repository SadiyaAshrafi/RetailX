from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "RetailX_Hackathon_Deck.pptx"
W, H = 13.333, 7.5

BG = "0B1115"
PANEL = "121D23"
PANEL_2 = "17242A"
LINE = "2C3A40"
INK = "EDF3F1"
MUTED = "A1AFB2"
FAINT = "77868B"
LIME = "D3EF7C"
BLUE = "70A9FF"
GREEN = "84D9AD"
AMBER = "F3BD71"
RED = "EF9D91"


def color(hex_value):
    return RGBColor.from_string(hex_value)


def rect(slide, x, y, w, h, fill, radius=False, line=None):
    shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(shape_type, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color(fill)
    if line:
        shape.line.color.rgb = color(line)
        shape.line.width = Pt(0.8)
    else:
        shape.line.fill.background()
    return shape


def text(slide, value, x, y, w, h, size=12, fill=INK, bold=False, font="Aptos", align=PP_ALIGN.LEFT, valign=MSO_ANCHOR.TOP, margin=0):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = box.text_frame
    frame.clear()
    frame.word_wrap = True
    frame.margin_left = Inches(margin)
    frame.margin_right = Inches(margin)
    frame.margin_top = Inches(margin)
    frame.margin_bottom = Inches(margin)
    frame.vertical_anchor = valign
    for index, line in enumerate(value.split("\n")):
        paragraph = frame.paragraphs[0] if index == 0 else frame.add_paragraph()
        paragraph.text = line
        paragraph.alignment = align
        paragraph.space_after = Pt(2)
        paragraph.font.name = font
        paragraph.font.size = Pt(size)
        paragraph.font.bold = bold
        paragraph.font.color.rgb = color(fill)
    return box


def line(slide, x1, y1, x2, y2, fill=LINE, width=1.0):
    shape = slide.shapes.add_connector(1, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    shape.line.color.rgb = color(fill)
    shape.line.width = Pt(width)
    return shape


def arrow(slide, x, y, w=0.28, fill=FAINT):
    shape = slide.shapes.add_shape(MSO_SHAPE.CHEVRON, Inches(x), Inches(y), Inches(w), Inches(0.22))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color(fill)
    shape.line.fill.background()
    return shape


def chip(slide, label, x, y, w, fill=PANEL_2, ink=MUTED):
    rect(slide, x, y, w, 0.29, fill, radius=True)
    text(slide, label, x + 0.08, y + 0.045, w - 0.16, 0.18, 7.5, ink, True, align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)


def base(prs, section, number):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = color(BG)
    rect(slide, 0.52, 0.42, 0.25, 0.25, LIME, radius=True)
    text(slide, "R", 0.52, 0.423, 0.25, 0.2, 9, BG, True, align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)
    text(slide, "RETAILX", 0.86, 0.435, 0.9, 0.18, 9, INK, True, font="Aptos Display")
    text(slide, section.upper(), 9.0, 0.45, 3.25, 0.17, 7.5, FAINT, True, align=PP_ALIGN.RIGHT)
    line(slide, 0.55, 0.82, 12.78, 0.82)
    line(slide, 0.55, 7.08, 12.78, 7.08)
    text(slide, "AIVEN-POWERED RETAIL | HACKATHON SUBMISSION", 0.58, 7.17, 5.1, 0.16, 7, FAINT, True)
    text(slide, f"{number:02d} / 07", 11.92, 7.16, 0.82, 0.18, 7.5, MUTED, True, align=PP_ALIGN.RIGHT)
    return slide


def heading(slide, kicker, title_value, subtitle=None):
    text(slide, kicker.upper(), 0.62, 1.08, 5.8, 0.2, 8, LIME, True)
    text(slide, title_value, 0.62, 1.39, 11.9, 0.52, 25, INK, True, font="Aptos Display")
    if subtitle:
        text(slide, subtitle, 0.64, 1.98, 11.6, 0.3, 10.5, MUTED)


def add_slide_1(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = color(BG)
    rect(slide, 0.68, 0.62, 0.34, 0.34, LIME, radius=True)
    text(slide, "R", 0.68, 0.66, 0.34, 0.23, 12, BG, True, align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)
    text(slide, "RETAILX", 1.13, 0.68, 1.4, 0.2, 11, INK, True, font="Aptos Display")
    chip(slide, "EVENT-DRIVEN COMMERCE", 9.63, 0.65, 2.92, PANEL_2, LIME)

    text(slide, "RETAILX AI", 0.7, 1.62, 5.7, 0.48, 30, INK, True, font="Aptos Display")
    text(slide, "COMMERCE PLATFORM", 0.7, 2.12, 7.05, 0.62, 34, INK, True, font="Aptos Display")
    text(slide, "Search smarter. Shop faster.\nKeep stock accurate.", 0.72, 2.96, 5.4, 0.8, 20, LIME, True, font="Aptos Display")
    text(slide, "A unified online retail experience, powered by\nAiven PostgreSQL, Apache Kafka, and OpenSearch.", 0.74, 4.02, 5.5, 0.56, 12, MUTED)

    text(slide, "THE COMMERCE LOOP", 7.17, 1.54, 4.7, 0.2, 8, FAINT, True)
    pillars = [
        ("01", "POSTGRESQL", "Truth", BLUE),
        ("02", "KAFKA", "Events", AMBER),
        ("03", "OPENSEARCH", "Discovery", GREEN),
    ]
    for index, (number, name, role, accent) in enumerate(pillars):
        y = 2.02 + index * 0.92
        rect(slide, 7.15, y, 4.98, 0.69, PANEL, radius=True, line=LINE)
        text(slide, number, 7.38, y + 0.2, 0.43, 0.2, 9, accent, True)
        text(slide, name, 8.0, y + 0.16, 2.34, 0.2, 10, INK, True)
        text(slide, role, 10.45, y + 0.17, 1.35, 0.2, 9, MUTED, align=PP_ALIGN.RIGHT)
    line(slide, 7.54, 2.72, 7.54, 2.98, FAINT, 1.2)
    line(slide, 7.54, 3.64, 7.54, 3.9, FAINT, 1.2)
    text(slide, "TEAM NAME: [ADD TEAM NAME]", 0.73, 5.65, 4.0, 0.24, 10, INK, True)
    text(slide, "TEAM ID: [ADD TEAM ID]", 0.73, 6.03, 3.2, 0.2, 9, MUTED)
    text(slide, "COLLEGE: [ADD COLLEGE NAME]", 4.2, 6.03, 4.5, 0.2, 9, MUTED)
    line(slide, 0.72, 6.48, 12.55, 6.48)
    text(slide, "PROJECT PITCH  /  2026", 0.73, 6.67, 3.1, 0.17, 7.5, FAINT, True)
    text(slide, "01 / 07", 11.8, 6.67, 0.75, 0.17, 7.5, MUTED, True, align=PP_ALIGN.RIGHT)
    return slide


def add_slide_2(prs):
    slide = base(prs, "Problem + existing gap", 2)
    heading(slide, "The problem", "Online retail breaks between systems.", "The shopper sees one store. The business often runs separate systems for orders, inventory, and discovery.")
    cards = [
        (0.62, "CUSTOMERS", "Stale stock\ncreates broken promises.", "Unavailable items can remain searchable or appear in stock after a store sells out.", BLUE),
        (4.72, "STORE OPERATIONS", "Manual fixes\nslow the response.", "Teams reconcile stock across locations and channels, often after a mismatch is noticed.", AMBER),
        (8.82, "DIGITAL TEAMS", "Disconnected data\nlimits visibility.", "Search, checkout, and operations dashboards may show different versions of the same product.", GREEN),
    ]
    for x, label, title_value, body, accent in cards:
        rect(slide, x, 2.68, 3.88, 2.05, PANEL, radius=True, line=LINE)
        rect(slide, x + 0.22, 2.94, 0.08, 0.42, accent, radius=True)
        text(slide, label, x + 0.42, 2.98, 2.9, 0.17, 7.5, accent, True)
        text(slide, title_value, x + 0.25, 3.53, 3.35, 0.55, 15, INK, True, font="Aptos Display")
        text(slide, body, x + 0.25, 4.2, 3.38, 0.42, 9, MUTED)

    rect(slide, 0.62, 5.08, 12.08, 1.25, "10191E", radius=True, line=LINE)
    text(slide, "EXISTING GAP", 0.88, 5.34, 1.45, 0.18, 8, LIME, True)
    text(slide, "Point solutions serve individual jobs; reliable, near-real-time coordination across the retail journey remains the integration challenge.", 2.45, 5.29, 9.72, 0.52, 12, INK, True)
    text(slide, "Retailers need one dependable loop from product search to stock change and back to search.", 0.88, 6.04, 10.95, 0.22, 9, MUTED)
    return slide


def add_slide_3(prs):
    slide = base(prs, "Proposed solution", 3)
    heading(slide, "The idea", "One event-driven loop for every order.", "RetailX connects product discovery, transactional data, and inventory events through Aiven services.")
    rect(slide, 0.62, 2.54, 12.08, 0.68, "18262B", radius=True, line=LINE)
    text(slide, "SEARCH", 0.92, 2.77, 1.0, 0.18, 9, BLUE, True)
    arrow(slide, 2.2, 2.76, 0.26, FAINT)
    text(slide, "ORDER", 2.78, 2.77, 1.0, 0.18, 9, LIME, True)
    arrow(slide, 4.05, 2.76, 0.26, FAINT)
    text(slide, "EVENT", 4.64, 2.77, 1.0, 0.18, 9, AMBER, True)
    arrow(slide, 5.94, 2.76, 0.26, FAINT)
    text(slide, "STOCK UPDATE", 6.52, 2.77, 1.5, 0.18, 9, GREEN, True)
    arrow(slide, 8.32, 2.76, 0.26, FAINT)
    text(slide, "SEARCH SYNC", 8.92, 2.77, 1.5, 0.18, 9, BLUE, True)
    arrow(slide, 10.75, 2.76, 0.26, FAINT)
    text(slide, "VISIBILITY", 11.32, 2.77, 1.1, 0.18, 9, INK, True)

    solutions = [
        (0.62, "01", "A trustworthy core", "PostgreSQL stores the catalog, carts, orders, and city-level inventory.", BLUE),
        (4.72, "02", "Events, not guesswork", "Kafka carries order and inventory changes to the services that need them.", AMBER),
        (8.82, "03", "Discovery stays fresh", "OpenSearch powers typo-tolerant search, filters, and autocomplete.", GREEN),
    ]
    for x, number, title_value, body, accent in solutions:
        rect(slide, x, 3.72, 3.88, 1.56, PANEL, radius=True, line=LINE)
        text(slide, number, x + 0.23, 3.96, 0.5, 0.2, 9, accent, True)
        text(slide, title_value, x + 0.23, 4.31, 3.38, 0.27, 12, INK, True, font="Aptos Display")
        text(slide, body, x + 0.23, 4.7, 3.38, 0.36, 9, MUTED)

    text(slide, "WHY IT'S BETTER", 0.68, 5.71, 1.7, 0.18, 8, LIME, True)
    text(slide, "A visible, measurable path from customer action to operational update, with each Aiven service doing the job it is built for.", 2.42, 5.65, 9.8, 0.42, 11, INK, True)
    return slide


def add_node(slide, x, y, w, title_value, subtitle, accent, tag=None):
    rect(slide, x, y, w, 0.89, PANEL, radius=True, line=LINE)
    rect(slide, x + 0.12, y + 0.14, 0.06, 0.58, accent, radius=True)
    text(slide, title_value, x + 0.28, y + 0.17, w - 0.4, 0.22, 9, INK, True)
    text(slide, subtitle, x + 0.28, y + 0.49, w - 0.4, 0.2, 7.2, MUTED)
    if tag:
        text(slide, tag, x + 0.28, y + 0.7, w - 0.4, 0.13, 6.2, accent, True)


def add_slide_4(prs):
    slide = base(prs, "Architecture + tech stack", 4)
    heading(slide, "System design", "Each service owns a clear responsibility.", "Input: shopper intent and orders. Process: transactional writes plus Kafka events. Output: accurate inventory and searchable products.")

    nodes = [
        (0.66, "CUSTOMER", "Search / checkout", BLUE),
        (2.68, "NEXT.JS 15", "React + TypeScript", LIME),
        (4.7, "EXPRESS API", "Zod + Prisma", BLUE),
        (6.72, "AIVEN POSTGRES", "Source of truth", BLUE),
        (8.74, "AIVEN KAFKA", "4 event topics", AMBER),
        (10.76, "CONSUMER", "Inventory worker", GREEN),
    ]
    for x, title_value, subtitle, accent in nodes:
        add_node(slide, x, 2.57, 1.7, title_value, subtitle, accent)
    for x in [2.4, 4.42, 6.44, 8.46, 10.48]:
        arrow(slide, x, 2.9, 0.18, FAINT)

    line(slide, 11.62, 3.5, 11.62, 4.02, GREEN, 1.2)
    line(slide, 11.62, 4.02, 7.65, 4.02, GREEN, 1.2)
    arrow(slide, 7.47, 3.91, 0.18, GREEN)
    add_node(slide, 5.62, 4.37, 2.0, "AIVEN OPENSEARCH", "Fuzzy search + index", GREEN, "SEARCH_SYNCED")
    add_node(slide, 8.15, 4.37, 2.02, "STOREFRONT", "Fresh results + stock", BLUE)
    arrow(slide, 7.78, 4.7, 0.22, FAINT)
    arrow(slide, 10.32, 4.7, 0.22, FAINT)
    add_node(slide, 0.66, 4.37, 2.1, "ADMIN CONSOLE", "Metrics + events", LIME)
    line(slide, 2.76, 4.81, 3.35, 4.81, LIME, 1.0)
    line(slide, 3.35, 4.81, 3.35, 3.6, LIME, 1.0)
    text(slide, "read-only views", 2.9, 4.57, 1.25, 0.15, 6.5, FAINT)

    rect(slide, 0.66, 5.68, 12.08, 0.81, "10191E", radius=True, line=LINE)
    text(slide, "STACK", 0.9, 5.98, 0.8, 0.17, 8, LIME, True)
    text(slide, "Next.js 15  |  React 19  |  TypeScript  |  Express  |  Prisma  |  PostgreSQL  |  KafkaJS  |  OpenSearch JS  |  TanStack Query", 1.78, 5.91, 10.55, 0.3, 9, INK, True)
    text(slide, "Order + inventory changes use a PostgreSQL outbox before publishing to Kafka.", 0.9, 6.23, 10.8, 0.15, 7.2, MUTED)
    return slide


def add_slide_5(prs):
    slide = base(prs, "Key features", 5)
    heading(slide, "What stands out", "Four features. One connected experience.", "Built around the moments where retail systems most often fall out of sync.")
    features = [
        (0.62, 2.55, "01", "Typo-tolerant discovery", "Fuzzy product search, category / city / price filters, and autocomplete through OpenSearch.", BLUE, "OPEN SEARCH"),
        (6.82, 2.55, "02", "Inventory by location", "Live stock checks at checkout, followed by city-level inventory updates.", GREEN, "STOCK ACCURACY"),
        (0.62, 4.27, "03", "Durable order events", "Order records and outbox events commit together before Kafka publishes them.", AMBER, "EVENT-DRIVEN"),
        (6.82, 4.27, "04", "Natural-language helper", "A conversational prompt maps intent and constraints into live catalog filters.", LIME, "ASSISTED SEARCH"),
    ]
    for x, y, number, title_value, body, accent, tag in features:
        rect(slide, x, y, 5.88, 1.43, PANEL, radius=True, line=LINE)
        text(slide, number, x + 0.23, y + 0.22, 0.45, 0.18, 8.5, accent, True)
        chip(slide, tag, x + 4.05, y + 0.18, 1.48, PANEL_2, accent)
        text(slide, title_value, x + 0.23, y + 0.55, 5.2, 0.24, 13, INK, True, font="Aptos Display")
        text(slide, body, x + 0.23, y + 0.91, 5.3, 0.36, 8.8, MUTED)
    text(slide, "INNOVATION", 0.68, 6.13, 1.05, 0.17, 8, LIME, True)
    text(slide, "The demo makes infrastructure behavior visible: judges can follow an order through PostgreSQL, Kafka, inventory, and search sync.", 1.85, 6.08, 10.3, 0.28, 10, INK, True)
    return slide


def add_slide_6(prs):
    slide = base(prs, "Impact + feasibility", 6)
    heading(slide, "Designed for real operations", "Useful now. Scalable as the network grows.", "A focused first step toward reliable omnichannel retail, without requiring a retailer to replace every existing system.")
    blocks = [
        (0.62, "WHO BENEFITS", "Customers", "Clearer availability and faster product discovery.", BLUE),
        (4.72, "WHO BENEFITS", "Store teams", "Fewer manual corrections and better city-level visibility.", GREEN),
        (8.82, "WHO BENEFITS", "Digital operators", "One event trail for orders, stock changes, and search sync.", AMBER),
    ]
    for x, label, title_value, body, accent in blocks:
        rect(slide, x, 2.55, 3.88, 1.4, PANEL, radius=True, line=LINE)
        text(slide, label, x + 0.22, 2.78, 1.8, 0.16, 7.2, accent, True)
        text(slide, title_value, x + 0.22, 3.08, 3.2, 0.23, 13, INK, True, font="Aptos Display")
        text(slide, body, x + 0.22, 3.43, 3.32, 0.32, 8.4, MUTED)

    rect(slide, 0.62, 4.27, 5.88, 1.62, "10191E", radius=True, line=LINE)
    text(slide, "SCALABILITY", 0.9, 4.55, 1.35, 0.16, 8, LIME, True)
    text(slide, "Managed Aiven services separate transactional storage, event throughput, and search load. Kafka partitions and consumer groups can scale with demand.", 0.9, 4.9, 5.15, 0.56, 10, INK)

    rect(slide, 6.82, 4.27, 5.88, 1.62, "10191E", radius=True, line=LINE)
    text(slide, "FEASIBILITY + COST", 7.1, 4.55, 1.75, 0.16, 8, LIME, True)
    text(slide, "The MVP is implemented with a migration and seed workflow. Use the smallest suitable Aiven plans, verify regional pricing, then scale after testing.", 7.1, 4.9, 5.15, 0.56, 10, INK)

    rect(slide, 0.62, 6.14, 12.08, 0.42, "2A2118", radius=True, line="584832")
    text(slide, "STATUS: Prototype built; live Aiven connection and end-to-end cloud validation are pending service credentials.", 0.86, 6.27, 11.55, 0.16, 8.3, AMBER, True)
    return slide


def add_slide_7(prs):
    slide = base(prs, "Demo + conclusion", 7)
    heading(slide, "The judge demo", "From one typo to an updated shelf.", "A short, observable story that connects customer experience to retail operations.")
    steps = [
        ("01", "SEARCH", "Type `bluetoth`; OpenSearch returns Bluetooth products."),
        ("02", "ORDER", "Add an item and place a stock-validated order."),
        ("03", "STREAM", "Kafka carries ORDER_CREATED and INVENTORY_UPDATED."),
        ("04", "SYNC", "OpenSearch refreshes the product; SEARCH_SYNCED is visible."),
    ]
    for index, (number, label, body) in enumerate(steps):
        y = 2.55 + index * 0.78
        rect(slide, 0.68, y, 6.36, 0.59, PANEL, radius=True, line=LINE)
        text(slide, number, 0.9, y + 0.2, 0.38, 0.16, 8.5, LIME, True)
        text(slide, label, 1.48, y + 0.19, 0.96, 0.17, 8.1, BLUE if index == 0 else AMBER if index == 2 else GREEN, True)
        text(slide, body, 2.52, y + 0.16, 4.24, 0.28, 8.2, INK)

    rect(slide, 7.5, 2.55, 5.18, 2.94, "16232A", radius=True, line=LINE)
    text(slide, "WHY RETAILX?", 7.82, 2.88, 2.0, 0.18, 8, LIME, True)
    text(slide, "We connect the\nshopper's promise\nto the store's reality.", 7.82, 3.3, 4.25, 1.12, 23, INK, True, font="Aptos Display")
    text(slide, "Search. Events. Stock.\nOne dependable retail loop.", 7.84, 4.72, 3.9, 0.44, 10, MUTED)

    rect(slide, 0.68, 5.95, 12.0, 0.62, "2A2118", radius=True, line="584832")
    text(slide, "DEMO READINESS", 0.92, 6.17, 1.36, 0.16, 7.5, AMBER, True)
    text(slide, "Prototype and integration code are ready; connect Aiven services and verify the live flow before presenting it as operational.", 2.42, 6.12, 9.9, 0.26, 8.5, INK, True)
    return slide


def build():
    prs = Presentation()
    prs.slide_width = Inches(W)
    prs.slide_height = Inches(H)
    prs.core_properties.title = "RetailX AI Commerce Platform"
    prs.core_properties.subject = "Hackathon first-round project pitch"
    prs.core_properties.author = "RetailX Team"
    prs.core_properties.keywords = "RetailX, Aiven, PostgreSQL, Kafka, OpenSearch, retail"

    add_slide_1(prs)
    add_slide_2(prs)
    add_slide_3(prs)
    add_slide_4(prs)
    add_slide_5(prs)
    add_slide_6(prs)
    add_slide_7(prs)

    prs.save(OUTPUT)
    print(f"Created {OUTPUT}")
    print(f"Slides: {len(prs.slides)}")


if __name__ == "__main__":
    build()