import docx
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def test_fix():
    src_path = r'd:\ColdChainRL\Coldchain final corrected report-1.docx.original_bak'
    doc = docx.Document(src_path)

    body = doc._body._body
    children = list(body)

    # 1. Locate boundaries: after Abstract and before Chapter 1
    abstract_end_idx = None
    chapter1_start_idx = None

    for i, child in enumerate(children):
        text = ''.join(child.itertext()).strip()
        if 'The system processes cold storage telemetry' in text:
            abstract_end_idx = i
        if 'CHAPTER 1' in text and chapter1_start_idx is None:
            chapter1_start_idx = i

    print(f'Abstract end at child {abstract_end_idx}, Chapter 1 start at child {chapter1_start_idx}')

    # 2. Remove all corrupted elements between Abstract end and Chapter 1 start
    for i in range(chapter1_start_idx - 1, abstract_end_idx, -1):
        body.remove(children[i])

    # Reference element to insert after
    ref_elem = children[abstract_end_idx]

    # Create temporary doc with clean elements
    temp_doc = docx.Document()

    # Helper: page break
    def add_pb(d):
        p = d.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        r = p.add_run()
        r.add_break(docx.enum.text.WD_BREAK.PAGE)
        return p

    # Page break after Abstract -> Starts Table of Contents (Page iv)
    add_pb(temp_doc)

    # ==========================================================
    # 1. TABLE OF CONTENTS (Page iv)
    # ==========================================================
    p_toc_title = temp_doc.add_paragraph()
    p_toc_title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc_title.paragraph_format.space_before = Pt(12)
    p_toc_title.paragraph_format.space_after = Pt(14)
    r = p_toc_title.add_run("TABLE OF CONTENTS")
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
        p0.paragraph_format.space_before = Pt(1.5)
        p0.paragraph_format.space_after = Pt(1.5)
        p0.paragraph_format.line_spacing = 1.0
        r0 = p0.add_run(c_no)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(9.5)
        if is_chapter: r0.bold = True

        p1 = row[1].paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p1.paragraph_format.space_before = Pt(1.5)
        p1.paragraph_format.space_after = Pt(1.5)
        p1.paragraph_format.line_spacing = 1.0
        r1 = p1.add_run(title)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(9.5)
        if is_chapter: r1.bold = True

        p2 = row[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before = Pt(1.5)
        p2.paragraph_format.space_after = Pt(1.5)
        p2.paragraph_format.line_spacing = 1.0
        r2 = p2.add_run(page)
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(9.5)
        if is_chapter: r2.bold = True

    # Page break after TOC -> Starts List of Figures (Page v)
    add_pb(temp_doc)

    # ==========================================================
    # 2. LIST OF FIGURES (Page v)
    # ==========================================================
    p_lof_title = temp_doc.add_paragraph()
    p_lof_title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lof_title.paragraph_format.space_before = Pt(12)
    p_lof_title.paragraph_format.space_after = Pt(14)
    r = p_lof_title.add_run("LIST OF FIGURES")
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

    # Page break after LOF -> Starts List of Tables (Page vi)
    add_pb(temp_doc)

    # ==========================================================
    # 3. LIST OF TABLES (Page vi)
    # ==========================================================
    p_lot_title = temp_doc.add_paragraph()
    p_lot_title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lot_title.paragraph_format.space_before = Pt(12)
    p_lot_title.paragraph_format.space_after = Pt(14)
    r = p_lot_title.add_run("LIST OF TABLES")
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

    # ==========================================================
    # SECTION BREAK AFTER LIST OF TABLES -> Ends Section 2 (Front Matter)
    # ==========================================================
    # This ends the front matter section (Abstract iii, TOC iv, LOF v, LOT vi)
    # and starts Chapter 1 on the next page in Section 3 (Arabic 1, 2, 3...)
    p_sec_break = temp_doc.add_paragraph()
    p_sec_break.paragraph_format.space_before = Pt(0)
    p_sec_break.paragraph_format.space_after = Pt(0)
    p_sec_break.paragraph_format.line_spacing = 1.0

    sectPr_fm = parse_xml(f'''
        <w:sectPr {nsdecls("w", "r")}>
            <w:footerReference w:type="default" r:id="rId10"/>
            <w:pgSz w:w="12240" w:h="15840"/>
            <w:pgMar w:top="1320" w:right="850" w:bottom="640" w:left="1133" w:header="0" w:footer="401" w:gutter="0"/>
            <w:pgNumType w:fmt="lowerRoman" w:start="3"/>
            <w:cols w:space="720"/>
            <w:docGrid w:linePitch="360"/>
        </w:sectPr>
    ''')
    p_sec_break._p.get_or_add_pPr().append(sectPr_fm)

    # Insert into main document
    curr_ref = ref_elem
    for elem in list(temp_doc._body._body):
        tag = elem.tag.split('}')[-1]
        if tag in ('p', 'tbl'):
            curr_ref.addnext(elem)
            curr_ref = elem

    # Uniform page size for all sections (8.5 x 11 in)
    target_w = Inches(8.5)
    target_h = Inches(11.0)
    for s in doc.sections:
        s.page_width = target_w
        s.page_height = target_h
        # Ensure single column layout
        cols = s._sectPr.xpath('./w:cols')
        if cols:
            cols[0].attrib.pop(f'{{{nsdecls("w")}}}num', None)
            cols[0].attrib.pop(f'{{{nsdecls("w")}}}equalWidth', None)

    # Now inspect sections:
    print(f'Total sections now: {len(doc.sections)}')
    for idx, s in enumerate(doc.sections):
        fr = s._sectPr.xpath('./w:footerReference')
        rids = [f.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id') for f in fr]
        pnt = s._sectPr.xpath('./w:pgNumType')
        pnt_attr = pnt[0].attrib if pnt else {}
        print(f'Sec {idx}: rids={rids}, pnt={pnt_attr}')

    out_docx = r'd:\ColdChainRL\Coldchain_final_perfect.docx'
    doc.save(out_docx)
    print(f'Saved to {out_docx}')

test_fix()
