import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def fix_toc_lof_lot():
    src_path = r'd:\ColdChainRL\Coldchain final corrected report-1.docx.original_bak'
    doc = docx.Document(src_path)

    body = doc._body._body
    children = list(body)

    # 1. Locate start (after Abstract text) and end (before Chapter 1 heading)
    abstract_p2_idx = None
    chapter1_idx = None

    for i, child in enumerate(children):
        text = ''.join(child.itertext()).strip()
        if 'The system processes cold storage telemetry' in text:
            abstract_p2_idx = i
        if 'CHAPTER 1' in text and chapter1_idx is None:
            chapter1_idx = i

    print(f'Abstract paragraph 2 at element {abstract_p2_idx}')
    print(f'Chapter 1 at element {chapter1_idx}')

    # Verify we found the exact boundaries
    assert abstract_p2_idx is not None and chapter1_idx is not None

    # The corrupt elements are strictly between abstract_p2_idx + 1 and chapter1_idx - 1
    # Let's inspect what is currently between them
    print(f'Removing {chapter1_idx - (abstract_p2_idx + 1)} corrupted body elements between Abstract and Chapter 1...')

    # Remove all elements between abstract_p2_idx + 1 and chapter1_idx
    # (do it in reverse order to keep indices stable)
    for i in range(chapter1_idx - 1, abstract_p2_idx, -1):
        body.remove(children[i])

    # Insertion point is immediately after children[abstract_p2_idx]
    ref_element = children[abstract_p2_idx]

    # Create a temporary document with the clean TOC, LOF, LOT structure
    temp_doc = docx.Document()
    # Set standard Letter page size
    for s in temp_doc.sections:
        s.page_width = Inches(8.5)
        s.page_height = Inches(11.0)
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)

    # Helper to add page break
    def add_pb(d):
        p = d.add_paragraph()
        r = p.add_run()
        r.add_break(docx.enum.text.WD_BREAK.PAGE)
        return p

    # Page break after Abstract
    add_pb(temp_doc)

    # ==========================================================
    # 1. TABLE OF CONTENTS (Page iv)
    # ==========================================================
    p_num = temp_doc.add_paragraph()
    p_num.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_num.paragraph_format.space_before = Pt(0)
    p_num.paragraph_format.space_after = Pt(4)
    r = p_num.add_run("iv")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)

    p_title = temp_doc.add_paragraph()
    p_title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(14)
    r = p_title.add_run("TABLE OF CONTENTS")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)

    t_toc = temp_doc.add_table(rows=1, cols=3)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_toc.rows[0].cells
    hdr[0].width = Inches(1.2)
    hdr[1].width = Inches(4.5)
    hdr[2].width = Inches(0.8)

    for i, h in enumerate(["CHAPTER\nNO.", "TITLE", "PAGE\nNO."]):
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i != 1 else WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.0
        r = p.add_run(h)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)

    toc_entries = [
        ("", "ABSTRACT", "iii"),
        ("1", "INTRODUCTION", "1"),
        ("1.1", "INTRODUCTION", "1"),
        ("1.2", "PROBLEM STATEMENT", "2"),
        ("1.3", "OBJECTIVES", "2"),
        ("2", "ADAPTIVE COLD-CHAIN RL SYSTEM ARCHITECTURE AND MODULES", "3"),
        ("2.1", "TECHNOLOGY / ALGORITHM", "3"),
        ("2.2", "MODULE'S DESCRIPTION", "5"),
        ("2.3", "SYSTEM REQUIREMENTS", "7"),
        ("3", "COMPANION SYSTEM DIAGRAMS AND FLOWCHARTS", "9"),
        ("3.1", "WORK FLOW DIAGRAM", "9"),
        ("3.2", "SYSTEM ARCHITECTURE DIAGRAM", "10"),
        ("4", "MATHEMATICAL MODEL AND FORMULATION", "12"),
        ("4.1", "EQUATIONS AND DERIVATIONS", "12"),
        ("5", "SIMULATION AND EXECUTION OF MODEL", "16"),
        ("5.1", "APPLICATION OF MODELLING TECHNIQUES", "16"),
        ("5.2", "USE OF MODERN TOOLS / SOFTWARE", "17"),
        ("5.3", "EXECUTION OF MODEL", "17"),
        ("5.4", "IMPLEMENTATION RESULTS", "19"),
        ("6", "INTERPRETATION OF RESULTS", "23"),
        ("6.1", "RESULTS AND DISCUSSIONS", "23"),
        ("7", "REFERENCES", "25"),
        ("", "APPENDIX", "26")
    ]

    for c_no, title, page in toc_entries:
        row = t_toc.add_row().cells
        row[0].width = Inches(1.2)
        row[1].width = Inches(4.5)
        row[2].width = Inches(0.8)
        is_chapter = (c_no != "" and "." not in c_no)

        p0 = row[0].paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p0.paragraph_format.space_before = Pt(1)
        p0.paragraph_format.space_after = Pt(1)
        p0.paragraph_format.line_spacing = 1.05
        r0 = p0.add_run(c_no)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(9.5)
        if is_chapter: r0.bold = True

        p1 = row[1].paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p1.paragraph_format.space_before = Pt(1)
        p1.paragraph_format.space_after = Pt(1)
        p1.paragraph_format.line_spacing = 1.05
        r1 = p1.add_run(title)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(9.5)
        if is_chapter: r1.bold = True

        p2 = row[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before = Pt(1)
        p2.paragraph_format.space_after = Pt(1)
        p2.paragraph_format.line_spacing = 1.05
        r2 = p2.add_run(page)
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(9.5)
        if is_chapter: r2.bold = True

    add_pb(temp_doc)

    # ==========================================================
    # 2. LIST OF FIGURES (Page v)
    # ==========================================================
    p_num = temp_doc.add_paragraph()
    p_num.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_num.paragraph_format.space_before = Pt(0)
    p_num.paragraph_format.space_after = Pt(4)
    r = p_num.add_run("v")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)

    p_title = temp_doc.add_paragraph()
    p_title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(14)
    r = p_title.add_run("LIST OF FIGURES")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)

    t_lof = temp_doc.add_table(rows=1, cols=3)
    t_lof.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_lof.rows[0].cells
    hdr[0].width = Inches(1.2)
    hdr[1].width = Inches(4.5)
    hdr[2].width = Inches(0.8)

    for i, h in enumerate(["FIGURE\nNO.", "FIGURE NAME", "PAGE\nNO."]):
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i != 1 else WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.0
        r = p.add_run(h)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)

    lof_entries = [
        ("3.1", "END-TO-END ADAPTIVE COLD-CHAIN RL SYSTEM WORKFLOW DIAGRAM", "8"),
        ("3.2", "MULTI-LAYERED ADAPTIVE COLD-CHAIN SYSTEM ARCHITECTURE", "9"),
        ("4.1", "MATHEMATICAL FORMULATION – THERMAL HEAT BALANCE AND Q-LEARNING SPOILAGE DYNAMICS", "11"),
        ("5.4.1", "COLD-CHAIN FLEET MONITORING DASHBOARD", "19"),
        ("5.4.2", "3D DIGITAL TWIN SIMULATION AND MANAGEMENT INTERFACE", "19"),
        ("5.4.3", "LIVE MULTI-UNIT TELEMETRY FEED", "20"),
        ("5.4.4", "AI DECISION AND Q-VALUE EXPLAINABILITY RESULTS", "20"),
        ("5.4.5", "THERMAL ANOMALY AND RISK DETECTION RESULTS", "21"),
        ("5.4.6", "INCIDENT AUDIT RECORDS AND EVENT REPORTING", "21"),
        ("5.4.7", "FORENSIC REPLAY AND 3D SCENARIO GALLERY", "22"),
        ("5.4.8", "COLD-CHAIN ANALYTICS AND STATISTICAL VISUALIZATION", "22")
    ]

    for f_no, name, page in lof_entries:
        row = t_lof.add_row().cells
        row[0].width = Inches(1.2)
        row[1].width = Inches(4.5)
        row[2].width = Inches(0.8)

        p0 = row[0].paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p0.paragraph_format.space_before = Pt(2)
        p0.paragraph_format.space_after = Pt(2)
        p0.paragraph_format.line_spacing = 1.1
        r0 = p0.add_run(f_no)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(9.5)

        p1 = row[1].paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p1.paragraph_format.space_before = Pt(2)
        p1.paragraph_format.space_after = Pt(2)
        p1.paragraph_format.line_spacing = 1.1
        r1 = p1.add_run(name)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(9.5)

        p2 = row[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before = Pt(2)
        p2.paragraph_format.space_after = Pt(2)
        p2.paragraph_format.line_spacing = 1.1
        r2 = p2.add_run(page)
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(9.5)

    add_pb(temp_doc)

    # ==========================================================
    # 3. LIST OF TABLES (Page vi)
    # ==========================================================
    p_num = temp_doc.add_paragraph()
    p_num.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_num.paragraph_format.space_before = Pt(0)
    p_num.paragraph_format.space_after = Pt(4)
    r = p_num.add_run("vi")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)

    p_title = temp_doc.add_paragraph()
    p_title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(14)
    r = p_title.add_run("LIST OF TABLES")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)

    t_lot = temp_doc.add_table(rows=1, cols=3)
    t_lot.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_lot.rows[0].cells
    hdr[0].width = Inches(1.2)
    hdr[1].width = Inches(4.5)
    hdr[2].width = Inches(0.8)

    for i, h in enumerate(["TABLE\nNO.", "TABLE NAME", "PAGE\nNO."]):
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i != 1 else WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.0
        r = p.add_run(h)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)

    lot_entries = [
        ("2.1", "TECHNOLOGY STACK SPECIFICATIONS", "3"),
        ("5.1", "APPLICATION OF MODELLING TECHNIQUES", "16"),
        ("5.2", "SOFTWARE TOOLCHAIN", "17"),
        ("6.1", "FUNCTIONAL PERFORMANCE SUMMARY", "23")
    ]

    for t_no, name, page in lot_entries:
        row = t_lot.add_row().cells
        row[0].width = Inches(1.2)
        row[1].width = Inches(4.5)
        row[2].width = Inches(0.8)

        p0 = row[0].paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p0.paragraph_format.space_before = Pt(2)
        p0.paragraph_format.space_after = Pt(2)
        p0.paragraph_format.line_spacing = 1.1
        r0 = p0.add_run(t_no)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(9.5)

        p1 = row[1].paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p1.paragraph_format.space_before = Pt(2)
        p1.paragraph_format.space_after = Pt(2)
        p1.paragraph_format.line_spacing = 1.1
        r1 = p1.add_run(name)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(9.5)

        p2 = row[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before = Pt(2)
        p2.paragraph_format.space_after = Pt(2)
        p2.paragraph_format.line_spacing = 1.1
        r2 = p2.add_run(page)
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(9.5)

    add_pb(temp_doc)

    # Now insert all elements from temp_doc._body._body into doc._body._body after ref_element!
    curr_ref = ref_element
    for elem in list(temp_doc._body._body):
        tag = elem.tag.split('}')[-1]
        if tag in ('p', 'tbl'):
            curr_ref.addnext(elem)
            curr_ref = elem

    # Ensure ALL sections in the entire document are uniform Letter (8.5 x 11 in)
    target_w = Inches(8.5)
    target_h = Inches(11.0)
    for s in doc.sections:
        s.page_width = target_w
        s.page_height = target_h
        # Ensure single column and no weird continuous breaks on main pages
        cols = s._sectPr.xpath('./w:cols')
        if cols:
            cols[0].attrib.pop(f'{{{nsdecls("w")}}}num', None)
            cols[0].attrib.pop(f'{{{nsdecls("w")}}}equalWidth', None)

    out_docx = r'd:\ColdChainRL\Coldchain final corrected report-1.docx'
    doc.save(out_docx)
    print(f'Successfully saved clean DOCX to: {out_docx}')

fix_toc_lof_lot()
