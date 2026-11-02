import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

FIGURES_DIR = r"d:\ColdChainRL\report_figures"
OUTPUT_DOCX = r"d:\ColdChainRL\ColdChain_RL_Final_Project_Report.docx"

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_styled_heading(doc, text, level):
    h = doc.add_heading(text, level=level)
    h.paragraph_format.keep_with_next = True
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(6)
    for run in h.runs:
        run.font.name = 'Times New Roman'
        run.font.color.rgb = RGBColor(0, 0, 0)
        if level == 1:
            run.font.size = Pt(14)
            run.bold = True
        elif level == 2:
            run.font.size = Pt(12)
            run.bold = True
        else:
            run.font.size = Pt(11)
            run.bold = True
    return h

def add_body_paragraph(doc, text, bold_prefix=None, space_after=6, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
    p = doc.add_paragraph()
    p.paragraph_format.alignment = align
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(space_after)
    
    if bold_prefix:
        r_bold = p.add_run(bold_prefix)
        r_bold.bold = True
        r_bold.font.name = 'Times New Roman'
        r_bold.font.size = Pt(11)
        r_bold.font.color.rgb = RGBColor(0, 0, 0)
        
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(0, 0, 0)
    return p

def add_bullet_item(doc, bold_title, description):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(4)
    
    r_bold = p.add_run(bold_title)
    r_bold.bold = True
    r_bold.font.name = 'Times New Roman'
    r_bold.font.size = Pt(11)
    r_bold.font.color.rgb = RGBColor(0, 0, 0)
    
    r_desc = p.add_run(f": {description}")
    r_desc.font.name = 'Times New Roman'
    r_desc.font.size = Pt(11)
    r_desc.font.color.rgb = RGBColor(0, 0, 0)
    return p

def build_docx():
    print("Initializing Word Document matching sample report template...")
    doc = Document()
    
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    # ==========================================================
    # 1. TITLE / COVER PAGE (Page 1)
    # ==========================================================
    p_title = doc.add_paragraph()
    p_title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(30)
    p_title.paragraph_format.space_after = Pt(16)
    r = p_title.add_run("ADAPTIVE REINFORCEMENT LEARNING FOR\nCOLD-CHAIN TEMPERATURE CONTROL AND\nSPOILAGE PREVENTION")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    
    p_course = doc.add_paragraph()
    p_course.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_course.paragraph_format.space_after = Pt(36)
    r = p_course.add_run("23IT54C – SIMULATION USING MODERN TOOLS")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11.5)
    
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(14)
    r = p_sub.add_run("Submitted by")
    r.font.italic = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    
    t_students = doc.add_table(rows=3, cols=2)
    t_students.alignment = WD_TABLE_ALIGNMENT.CENTER
    student_data = [
        ("RADHA R", "2403957620522008"),
        ("MANASHA K", "2403957620522009"),
        ("SHARUMATHI M", "2403957620522035")
    ]
    for i, (name, reg) in enumerate(student_data):
        row = t_students.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(3.2)
        c1.width = Inches(2.2)
        
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r0 = p0.add_run(name)
        r0.bold = True
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(11)
        
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r1 = p1.add_run(reg)
        r1.bold = True
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(11)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(30)
    
    p_deg = doc.add_paragraph()
    p_deg.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_deg.paragraph_format.space_after = Pt(4)
    r = p_deg.add_run("In partial fulfillment for the award of the degree\nof\nBACHELOR OF TECHNOLOGY\nin\nINFORMATION TECHNOLOGY")
    r.font.italic = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(25)
    
    p_inst = doc.add_paragraph()
    p_inst.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_after = Pt(2)
    r = p_inst.add_run("NATIONAL ENGINEERING COLLEGE\n(An Autonomous Institution affiliated to Anna University, Chennai)\nK.R. NAGAR, KOVILPATTI - 628503\nOCTOBER 2026")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    
    doc.add_page_break()
    
    # ==========================================================
    # 2. BONAFIDE CERTIFICATE (Page 2)
    # ==========================================================
    p_cert_head = doc.add_paragraph()
    p_cert_head.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert_head.paragraph_format.space_after = Pt(18)
    r = p_cert_head.add_run("NATIONAL ENGINEERING COLLEGE\n(An Autonomous Institution affiliated to Anna University, Chennai)\nK.R. NAGAR, KOVILPATTI - 628503")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11.5)
    
    p_bon = doc.add_paragraph()
    p_bon.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_bon.paragraph_format.space_before = Pt(20)
    p_bon.paragraph_format.space_after = Pt(24)
    r = p_bon.add_run("BONAFIDE CERTIFICATE")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12.5)
    
    cert_text = (
        "This is to certify that this project report, “ADAPTIVE REINFORCEMENT LEARNING FOR "
        "COLD-CHAIN TEMPERATURE CONTROL AND SPOILAGE PREVENTION”, is the bonafide work of "
        "RADHA R (2403957620522008), MANASHA K (2403957620522009) and SHARUMATHI M "
        "(2403957620522035) who carried out the project work under my supervision."
    )
    p_cbody = doc.add_paragraph()
    p_cbody.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_cbody.paragraph_format.line_spacing = 1.3
    p_cbody.paragraph_format.space_after = Pt(70)
    r = p_cbody.add_run(cert_text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    
    p_ci = doc.add_paragraph()
    p_ci.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_ci.paragraph_format.space_after = Pt(50)
    r = p_ci.add_run("Course Instructor")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    
    p_viva = doc.add_paragraph()
    p_viva.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_viva.paragraph_format.space_after = Pt(36)
    r = p_viva.add_run("Submitted to the 23IT54C – SIMULATION USING MODERN TOOLS Viva-Voce examination held at National Engineering College, K.R. Nagar, Kovilpatti on 21.10.2026")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10.5)
    
    t_exam = doc.add_table(rows=1, cols=2)
    t_exam.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_exam.rows[0].cells[0].width = Inches(3.2)
    t_exam.rows[0].cells[1].width = Inches(3.2)
    p_in = t_exam.rows[0].cells[0].paragraphs[0]
    p_in.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p_in.add_run("Internal Examiner")
    r.bold = True
    r.font.name = 'Times New Roman'
    
    p_co = t_exam.rows[0].cells[1].paragraphs[0]
    p_co.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = p_co.add_run("Co Examiner")
    r.bold = True
    r.font.name = 'Times New Roman'
    
    doc.add_page_break()
    
    # ==========================================================
    # 3. ABSTRACT (Page iii)
    # ==========================================================
    p_ab_num = doc.add_paragraph()
    p_ab_num.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ab_num.paragraph_format.space_after = Pt(6)
    r = p_ab_num.add_run("iii")
    r.font.name = 'Times New Roman'
    
    p_ab_title = doc.add_paragraph()
    p_ab_title.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ab_title.paragraph_format.space_after = Pt(16)
    r = p_ab_title.add_run("ABSTRACT")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    
    abstract_p1 = (
        "The Adaptive Reinforcement Learning System for Cold-Chain Temperature Control and Spoilage Prevention is an "
        "intelligent thermodynamic simulation and control system designed to automatically analyze cold-chain sensor streams, "
        "model biological degradation kinetics, optimize closed-loop refrigeration actuation, and preserve digital audit evidence "
        "for further review. Traditional cold-chain monitoring depends heavily on continuous manual observation and static On-Off "
        "thermostats. Such monitoring becomes difficult in complex multi-echelon transit and warehouse environments because multiple "
        "reefer units, temperature zones, door status, ambient heatwaves, and perishable commodity types must be monitored "
        "simultaneously. Important thermal anomaly events such as compressor degradation, door propping, ambient heat spikes, "
        "and sub-zero boundary violations may therefore be missed."
    )
    add_body_paragraph(doc, abstract_p1, space_after=10)
    
    abstract_p2 = (
        "The system processes cold storage telemetry by first ingesting continuous sensor readings and then tracking thermodynamic state "
        "transitions across consecutive time steps. The recorded state variables are further analyzed using mathematical models such as "
        "Newton-Fourier heat transfer balance, Arrhenius biological spoilage kinetics, Markov Decision Process continuous state quantization, "
        "composite reward formulation, Bellman temporal difference updates, and epsilon-greedy exploration decay to understand chamber thermal "
        "evolution and biological decay velocity. Based on these analyses, optimal compressor cooling levels (Off, Eco, High, Turbo) are "
        "applied to prevent product spoilage and automatically capture timestamped anomaly evidence. The processed telemetry records and "
        "incident logs are then made available through the centralized monitoring dashboard, providing live multi-unit surveillance, "
        "3D digital twin simulation, AI decision explainability, strategy benchmarking, and forensic analytics."
    )
    add_body_paragraph(doc, abstract_p2, space_after=10)
    
    doc.add_page_break()
    
    # ==========================================================
    # 4. TABLE OF CONTENTS (Page iv)
    # ==========================================================
    p_toc_num = doc.add_paragraph()
    p_toc_num.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_toc_num.add_run("iv")
    r.font.name = 'Times New Roman'
    
    p_toc = doc.add_paragraph()
    p_toc.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc.paragraph_format.space_after = Pt(14)
    r = p_toc.add_run("TABLE OF CONTENTS")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    
    t_toc = doc.add_table(rows=1, cols=3)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_toc.rows[0].cells
    hdr[0].width = Inches(1.2)
    hdr[1].width = Inches(4.5)
    hdr[2].width = Inches(0.8)
    
    for i, h in enumerate(["CHAPTER\nNO.", "TITLE", "PAGE\nNO."]):
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i != 1 else WD_ALIGN_PARAGRAPH.LEFT
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
        
        is_chapter = c_no != "" and not "." in c_no
        p0 = row[0].paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r0 = p0.add_run(c_no)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(10)
        if is_chapter: r0.bold = True
        
        p1 = row[1].paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r1 = p1.add_run(title)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(10)
        if is_chapter: r1.bold = True
        
        p2 = row[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r2 = p2.add_run(page)
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(10)
        if is_chapter: r2.bold = True
        
    doc.add_page_break()
    
    # ==========================================================
    # 5. LIST OF FIGURES (Page v)
    # ==========================================================
    p_lof_num = doc.add_paragraph()
    p_lof_num.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_lof_num.add_run("v")
    r.font.name = 'Times New Roman'
    
    p_lof = doc.add_paragraph()
    p_lof.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lof.paragraph_format.space_after = Pt(14)
    r = p_lof.add_run("LIST OF FIGURES")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    
    t_lof = doc.add_table(rows=1, cols=3)
    t_lof.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_lof.rows[0].cells
    hdr[0].width = Inches(1.2)
    hdr[1].width = Inches(4.5)
    hdr[2].width = Inches(0.8)
    
    for i, h in enumerate(["FIGURE\nNO.", "FIGURE NAME", "PAGE\nNO."]):
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i != 1 else WD_ALIGN_PARAGRAPH.LEFT
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
        r0 = p0.add_run(f_no)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(10)
        
        p1 = row[1].paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r1 = p1.add_run(name)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(10)
        
        p2 = row[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r2 = p2.add_run(page)
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(10)
        
    doc.add_page_break()
    
    # ==========================================================
    # 6. LIST OF TABLES (Page vi)
    # ==========================================================
    p_lot_num = doc.add_paragraph()
    p_lot_num.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_lot_num.add_run("vi")
    r.font.name = 'Times New Roman'
    
    p_lot = doc.add_paragraph()
    p_lot.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lot.paragraph_format.space_after = Pt(14)
    r = p_lot.add_run("LIST OF TABLES")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    
    t_lot = doc.add_table(rows=1, cols=3)
    t_lot.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_lot.rows[0].cells
    hdr[0].width = Inches(1.2)
    hdr[1].width = Inches(4.5)
    hdr[2].width = Inches(0.8)
    
    for i, h in enumerate(["TABLE\nNO.", "TABLE NAME", "PAGE\nNO."]):
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i != 1 else WD_ALIGN_PARAGRAPH.LEFT
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
        r0 = p0.add_run(t_no)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(10)
        
        p1 = row[1].paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r1 = p1.add_run(name)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(10)
        
        p2 = row[2].paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r2 = p2.add_run(page)
        r2.font.name = 'Times New Roman'
        r2.font.size = Pt(10)
        
    doc.add_page_break()
    
    # ==========================================================
    # 7. CHAPTER 1: INTRODUCTION (Page 1)
    # ==========================================================
    add_styled_heading(doc, "CHAPTER 1", 1)
    add_styled_heading(doc, "INTRODUCTION", 1)
    
    add_styled_heading(doc, "1.1 INTRODUCTION", 2)
    intro_1 = (
        "In modern perishable logistics systems, effective temperature control is an essential requirement for maintaining product "
        "integrity, ensuring compliance with food and pharmaceutical regulations, and managing increasingly complex cold-chain "
        "environments. Logistics operators rely heavily on continuous surveillance of refrigerated warehouses, reefer containers, "
        "and transit corridors where multiple commodities, cooling zones, door actuations, and power availability must be monitored "
        "simultaneously. As cold-chain scale and route complexity increase, manual monitoring becomes a bottleneck because human "
        "operators cannot consistently observe every sensor feed and every thermal disturbance throughout continuous logistics operations. "
        "Important events such as heatwave spikes, door loading incursions, compressor brownouts, and unsafe thermal drift may therefore "
        "be missed, resulting in reduced cooling efficiency and delayed identification of commodity spoilage."
    )
    add_body_paragraph(doc, intro_1)
    
    intro_2 = (
        "Traditionally, cold storage surveillance has depended heavily on manual temperature logging and simple On-Off thermostats, "
        "where operators intermittently check sensor values and identify critical thermal breaches. Manual monitoring becomes particularly "
        "difficult in multi-commodity warehouses and dynamic transit routes because diverse products (such as dairy, fresh produce, "
        "seafood, meats, and vaccines) appear simultaneously and their thermal bounds must be continuously respected. Identifying a unit's "
        "temperature trajectory, spoilage accumulation rate, energy draw, cooling level, or breach into an unsafe danger zone requires "
        "continuous analysis over multiple time steps. The limitations of conventional manual surveillance create a need for an automated "
        "system capable of analyzing cold-chain telemetry, identifying thermal anomalies, and preserving evidence for further review."
    )
    add_body_paragraph(doc, intro_2)
    
    intro_3 = (
        "Modern intelligent cold-chain monitoring systems can utilize reinforcement-learning-based analysis to transform continuous "
        "telemetry into actionable operational intelligence. Such a system can monitor reefer containers, warehouse chambers, and transit "
        "assets while tracking individual commodity states throughout the storage lifecycle. By analyzing thermodynamic state transitions "
        "and applying adaptive Q-Learning policies, the system can identify thermal anomalies, optimize multi-stage cooling actuation, "
        "and prevent product spoilage. Mathematical models such as Newton-Fourier heat transfer, Arrhenius reaction kinetics, state "
        "quantization, reward computation, and risk estimation can further support the interpretation of cold-chain activity."
    )
    add_body_paragraph(doc, intro_3)
    
    intro_4 = (
        "To address the limitations of manual monitoring, the proposed system automatically analyzes cold storage telemetry to track "
        "unit states, optimize cooling levels, and preserve forensic evidence. It models internal chamber temperatures, commodity "
        "degradation kinetics, and electrical power consumption, identifies major thermal breaches, captures incident logs, and provides "
        "fleet statistics through a centralized dashboard. The system also supports an interactive 3D WebGL Digital Twin of the storage "
        "chamber and empirical policy benchmarking for comprehensive cold-chain management. It helps transform continuous sensor telemetry "
        "into structured and actionable operational intelligence for further review."
    )
    add_body_paragraph(doc, intro_4)
    
    add_styled_heading(doc, "1.2 PROBLEM STATEMENT", 2)
    ps_intro = (
        "Logistics departments face significant challenges in continuously monitoring distributed cold storage units and transit reefers "
        "using conventional thermostat methods. The core problem addressed by this project is developing an automated system to analyze "
        "sensor telemetry, track thermal states, optimize closed-loop cooling actions, and preserve evidence for review. The critical "
        "cold-chain challenges addressed by this project include:"
    )
    add_body_paragraph(doc, ps_intro)
    
    add_bullet_item(doc, "1. Manual Monitoring Limitation", "Continuous manual temperature logging makes it difficult to consistently track all storage units, ambient fluctuations, and sudden heat spikes. Important thermal breaches may be missed during prolonged transit.")
    add_bullet_item(doc, "2. Difficulty in Identifying Violations", "Loading dock door incursions, compressor brownouts, and rapid ambient heatwaves may be missed when multiple units operate simultaneously. Manual observation becomes less reliable in complex logistics networks.")
    add_bullet_item(doc, "3. Complex Thermodynamic Analysis", "Effective cold-chain control requires tracking chamber states and analyzing convective heat flux, cargo thermal inertia, Arrhenius spoilage kinetics, and power consumption. Simple visual inspection is insufficient for accurately interpreting these physical dynamics.")
    add_bullet_item(doc, "4. Need for Automated Evidence", "A reliable system must automatically detect thermal anomalies, preserve timestamped evidence, and generate structured incident records for review. This reduces manual effort and supports efficient cold-chain monitoring and decision-making.")
    
    add_styled_heading(doc, "1.3 OBJECTIVES", 2)
    obj_intro = (
        "The primary objective of this project is to develop an automated cold-chain monitoring and reinforcement learning control system "
        "that analyzes telemetry data, optimizes compressor cooling actions, prevents commodity spoilage, and provides operational "
        "events and statistics through a centralized monitoring dashboard. The specific technical objectives are as follows:"
    )
    add_body_paragraph(doc, obj_intro)
    
    add_bullet_item(doc, "1. Telemetry Acquisition and Ingestion", "To ingest temperature, humidity, ambient weather, and door contact sensor streams across multi-unit cold storage assets.")
    add_bullet_item(doc, "2. State Tracking and Movement Estimation", "To track chamber thermal states and estimate cooling trajectory, thermal drift, and spoilage accumulation.")
    add_bullet_item(doc, "3. Thermal Violation Identification", "To identify critical temperature breaches, prolonged unsafe exposure, compressor degradation, and high-risk thermal events.")
    add_bullet_item(doc, "4. Interactive 3D Digital Twin Simulation", "To simulate cold storage operations using an interactive 3D WebGL Digital Twin with commodity-specific models, motorized fan rotors, airflow particles, and autonomous AGV robots.")
    add_bullet_item(doc, "5. Evidence Capture and Incident Record Generation", "To automatically capture thermal violation evidence and generate structured incident audit records.")
    add_bullet_item(doc, "6. Centralized Monitoring and Analytics", "To provide fleet statistics, Q-value explainability, and multi-strategy benchmarks through a centralized control room dashboard.")
    
    doc.add_page_break()
    
    # ==========================================================
    # 8. CHAPTER 2: ARCHITECTURE AND MODULES (Page 3)
    # ==========================================================
    add_styled_heading(doc, "CHAPTER 2", 1)
    add_styled_heading(doc, "ADAPTIVE COLD-CHAIN RL SYSTEM ARCHITECTURE AND MODULES", 1)
    
    add_styled_heading(doc, "2.1 TECHNOLOGY / ALGORITHM", 2)
    tech_p1 = (
        "The Adaptive Cold-Chain RL System is engineered using a modular software architecture designed for automated telemetry "
        "processing, thermal state estimation, reinforcement learning decision-making, mathematical analysis, anomaly identification, "
        "evidence generation, and centralized cold-chain monitoring. The system uses Python as the core development and processing "
        "environment, with Tabular Q-Learning for adaptive control policy optimization, Newton-Fourier differential solvers for "
        "thermodynamic heat transfer, and Arrhenius kinetics for modeling biological degradation. The architecture further integrates "
        "FastAPI for communication between the simulation engine and monitoring dashboard, React with Vite for the frontend interface, "
        "SQLite for storing unit details, product profiles, and incident records, and Recharts for telemetry and benchmark visualization."
    )
    add_body_paragraph(doc, tech_p1)
    
    add_styled_heading(doc, "2.1.1 Technology Stack Specifications", 3)
    add_body_paragraph(doc, "Table 2.1 summarizes the technology stack used throughout the proposed cold-chain system, including the programming environment, RL algorithms, thermodynamic solvers, backend, frontend, database, and visualization technologies.")
    
    t_stack = doc.add_table(rows=1, cols=4)
    t_stack.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_stack.rows[0].cells
    hdr[0].width = Inches(1.5)
    hdr[1].width = Inches(1.3)
    hdr[2].width = Inches(1.1)
    hdr[3].width = Inches(2.6)
    
    for i, h in enumerate(["Category", "Technology / Tool", "Version", "Operational Role"]):
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        set_cell_background(hdr[i], "E2E8F0")
        
    stack_data = [
        ("Programming Language", "Python", "3.14.4", "Core development, thermodynamic processing, mathematical calculations, and RL control"),
        ("RL Algorithm", "Q-Learning", "Tabular", "180-state MDP optimization, Bellman updates, and 4-level cooling action selection"),
        ("Thermodynamic Engine", "Newton-Fourier", "4.x Custom", "Heat balance solver, ambient thermal flux, and convective heat transfer"),
        ("Biological Kinetics", "Arrhenius Kinetics", "Latest", "Exponential shelf-life degradation and spoilage rate modeling"),
        ("Mathematical Processing", "NumPy", "2.4.6", "State quantization, vector calculations, and matrix operations"),
        ("Backend API", "FastAPI", "0.x", "Connect the simulation engine with the monitoring dashboard via REST and WebSocket"),
        ("Frontend", "React + Vite", "React 19.x / Vite 7.x", "Build the centralized cold-chain monitoring and 3D digital twin dashboard"),
        ("Database", "SQLite", "3.x", "Store unit records, 15 product profiles, and incident audit logs"),
        ("Visualization", "Three.js / Recharts", "Three r174 / Recharts 2.x", "Render 3D warehouse digital twin and display real-time telemetry charts")
    ]
    
    for cat, tech, ver, role in stack_data:
        row = t_stack.add_row().cells
        row[0].width = Inches(1.5)
        row[1].width = Inches(1.3)
        row[2].width = Inches(1.1)
        row[3].width = Inches(2.6)
        
        for idx, val in enumerate([cat, tech, ver, role]):
            p = row[idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if idx in [1, 2] else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)
            if idx == 0: r.bold = True
            set_cell_margins(row[idx], top=60, bottom=60, left=80, right=80)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    add_styled_heading(doc, "2.1.2 Algorithmic Overview and Reinforcement Learning Paradigm", 3)
    algo_text = (
        "The fundamental algorithmic approach of this project is based on transforming raw sensor telemetry into structured "
        "operational intelligence through continuous state tracking, mathematical modelling, and reinforcement-learning-based cooling "
        "actuation. Instead of relying only on static threshold rules, the system follows the thermal trajectory of storage units across "
        "consecutive time steps and analyzes their thermodynamic and biological behavior."
    )
    add_body_paragraph(doc, algo_text)
    
    add_body_paragraph(doc, "Given a sequence of telemetry readings, the framework executes the following major processing stages:")
    add_bullet_item(doc, "Telemetry Ingestion", "FastAPI processes incoming sensor streams and identifies relevant chamber parameters including temperature, humidity, ambient weather, and compressor status.")
    add_bullet_item(doc, "State Discretization", "The system discretizes continuous multi-dimensional telemetry into 180 discrete MDP state bins, allowing complex physical dynamics to be tracked deterministically.")
    add_bullet_item(doc, "Movement and Mathematical Analysis", "The recorded temperature and cooling values are used to calculate convective heat flux, thermal drift velocity, Arrhenius reaction rates, and energy consumption.")
    add_bullet_item(doc, "Reinforcement Learning Policy Evaluation", "The Q-Learning agent evaluates the 180x4 Q-matrix to select optimal compressor cooling levels (Off, Eco, High, Turbo) using an epsilon-greedy strategy.")
    add_bullet_item(doc, "Thermal Violation Detection and Evidence Generation", "When critical temperature thresholds are breached, the anomaly is identified, and timestamped forensic evidence is captured for review.")
    add_bullet_item(doc, "Cold-Chain Monitoring and Reporting", "Detected events, incident records, and fleet statistics are presented through the centralized monitoring dashboard and 3D digital twin.")
    
    add_styled_heading(doc, "2.2 MODULE'S DESCRIPTION", 2)
    add_body_paragraph(doc, "The overall system functionality is partitioned into ten distinct, interconnected software modules. Each module performs a specialized sensing, state tracking, mathematical analysis, control actuation, evidence generation, storage, or visualization task within the end-to-end cold-chain pipeline.")
    
    modules = [
        ("2.2.1 Cold-Chain Telemetry Input and Preprocessing Module", "Serves as the initial gateway for acquiring reefer and warehouse sensor streams. The input consists of temperature, humidity, ambient weather, and door contact signals. The telemetry frames are preprocessed and smoothed before state estimation."),
        ("2.2.2 MDP Continuous State Discretization Module", "Converts continuous multi-dimensional telemetry into discrete state indices (180 total states) partitioned into 5 temperature zones, 3 humidity bands, 3 spoilage levels, and 4 risk categories."),
        ("2.2.3 Q-Learning Decision and Policy Optimization Module", "Maintains the 180-state Q-table and evaluates optimal compressor cooling actions (Off, Eco, High, Turbo) based on learned state-action values to maximize cumulative shelf-life preservation."),
        ("2.2.4 Newton-Fourier Thermodynamic Heat Balance Solver Module", "Solves the differential convective heat transfer equation accounting for ambient heat flux, door incursion, cargo thermal mass, and active evaporator cooling."),
        ("2.2.5 Arrhenius Biological Spoilage Kinetics Module", "Calculates instantaneous reaction rate constants and cumulative shelf-life degradation using temperature-dependent exponential reaction kinetics."),
        ("2.2.6 Multi-Objective Reward Computation Module", "Computes immediate step rewards penalizing temperature deviations from target setpoints, exponential spoilage velocity, compressor power surges, and severe threshold violations."),
        ("2.2.7 Physical Hazard and Stress Disturbance Injection Module", "Simulates real-world environmental stress scenarios including desert highway heatwaves (+42°C), propped-open dock doors, and compressor electrical brownouts."),
        ("2.2.8 Interactive 3D WebGL Digital Twin Chamber Module", "Renders a studio-lit 3D warehouse cutaway in Three.js with dedicated 3D product crate models for 15 commodities, motorized fan rotors, cold airflow mist particles, and AGV floor robots."),
        ("2.2.9 Multi-Strategy Benchmarking and Comparative Evaluation Module", "Executes automated 100-step controlled stress comparisons between Q-Learning, PID feedback, Fixed Rule-Based, and Random policies under identical thermal loads."),
        ("2.2.10 Cold-Chain Dashboard, Storage and Analytics Module", "Provides centralized access to fleet telemetry, 3D simulation, AI decision explainability, incident management, and forensic time-series analytics using FastAPI, SQLite, and React with Vite.")
    ]
    
    for m_title, m_desc in modules:
        add_body_paragraph(doc, m_desc, bold_prefix=m_title)
        
    add_styled_heading(doc, "2.3 SYSTEM REQUIREMENTS", 2)
    add_styled_heading(doc, "2.3.1 Hardware Requirements", 3)
    add_body_paragraph(doc, "The hardware specifications recommended for model development, simulation execution, telemetry analysis, and dashboard operation are:")
    add_bullet_item(doc, "Processor (CPU)", "Intel Core i5 / AMD Ryzen 5 or higher")
    add_bullet_item(doc, "System Memory (RAM)", "Minimum 8 GB")
    add_bullet_item(doc, "Storage", "Minimum 256 GB SSD")
    add_bullet_item(doc, "Graphics (GPU)", "Integrated graphics for basic execution; dedicated NVIDIA GPU recommended for faster 3D rendering")
    add_bullet_item(doc, "Display", "Standard HD display")
    add_bullet_item(doc, "Telemetry Input", "Live IoT sensor stream or simulated cold-chain reefer source")
    add_bullet_item(doc, "Network Interface", "Standard Ethernet / Wi-Fi interface for system communication")
    
    add_styled_heading(doc, "2.3.2 Software Requirements", 3)
    add_body_paragraph(doc, "The software environments, programming frameworks, libraries, database systems, and development tools required to execute the proposed system are:")
    add_bullet_item(doc, "Operating System", "Microsoft Windows 10/11 64-bit or Ubuntu Linux")
    add_bullet_item(doc, "Architecture", "64-bit OS")
    add_bullet_item(doc, "Programming Language", "Python")
    add_bullet_item(doc, "RL Engine", "Tabular Q-Learning")
    add_bullet_item(doc, "3D Graphics Engine", "Three.js (WebGL)")
    add_bullet_item(doc, "Mathematical Processing", "NumPy")
    add_bullet_item(doc, "Backend Framework", "FastAPI")
    add_bullet_item(doc, "Frontend Framework", "React + Vite")
    add_bullet_item(doc, "Database", "SQLite")
    add_bullet_item(doc, "Visualization", "Recharts / Lucide React")
    add_bullet_item(doc, "Development Environment", "VS Code / equivalent Python development environment")
    add_bullet_item(doc, "Browser", "Modern web browser for dashboard access")
    
    doc.add_page_break()
    
    # ==========================================================
    # 9. CHAPTER 3: DIAGRAMS AND FLOWCHARTS (Page 8)
    # ==========================================================
    add_styled_heading(doc, "CHAPTER 3", 1)
    add_styled_heading(doc, "COMPANION SYSTEM DIAGRAMS AND FLOWCHARTS", 1)
    
    add_styled_heading(doc, "3.1 WORK FLOW DIAGRAM", 2)
    add_body_paragraph(doc, "The end-to-end operation of the proposed Adaptive Cold-Chain RL System follows a structured sequential pipeline, beginning with telemetry input and preprocessing, followed by state discretization, Q-learning policy evaluation, thermodynamic actuation, spoilage analysis, evidence generation, and centralized dashboard reporting.")
    
    fig1_path = os.path.join(FIGURES_DIR, "fig_3_1_workflow.png")
    if os.path.exists(fig1_path):
        p_img = doc.add_paragraph()
        p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        doc.add_picture(fig1_path, width=Inches(5.4))
        
    p_cap1 = doc.add_paragraph()
    p_cap1.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap1.paragraph_format.space_after = Pt(12)
    r = p_cap1.add_run("Fig 3.1: End-to-End Adaptive Cold-Chain RL System Workflow Diagram")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    
    add_body_paragraph(doc, "Detailed Operational Workflow Description:", bold_prefix=None)
    add_bullet_item(doc, "1. Telemetry Ingestion", "Continuous sensor telemetry is acquired as the input source for analyzing reefer units, chamber temperatures, humidity, and door states.")
    add_bullet_item(doc, "2. Telemetry Preprocessing", "The incoming sensor signals are processed and smoothed to prepare the data for state estimation and subsequent thermodynamic analysis.")
    add_bullet_item(doc, "3. MDP State Quantization", "The continuous chamber metrics are mapped into discrete state bins (T0-T4, H0-H2, S0-S2, R0-R3) to create a compact 180-state representation.")
    add_bullet_item(doc, "4. Q-Learning Policy Evaluation", "The Q-Learning agent evaluates the state index against its learned Q-table to determine the optimal compressor cooling level.")
    add_bullet_item(doc, "5. Closed-Loop Actuation", "The thermodynamic solver applies Newton-Fourier convective heat transfer and calculates the resulting chamber temperature and energy draw.")
    add_bullet_item(doc, "6. Evidence and Reporting", "Detected thermal breaches and anomalies are captured as forensic evidence and converted into structured incident records for review.")
    add_bullet_item(doc, "7. Dashboard Visualization", "The processed fleet telemetry, 3D simulation, AI decision explainability, and analytics are provided through the centralized monitoring dashboard.")
    
    doc.add_page_break()
    
    add_styled_heading(doc, "3.2 SYSTEM ARCHITECTURE DIAGRAM", 2)
    add_body_paragraph(doc, "Figure 3.2 illustrates the modular, multi-layered architecture of the proposed Adaptive Cold-Chain RL System. The architecture integrates telemetry acquisition, preprocessing, state discretization, reinforcement learning, closed-loop actuation, evidence management, and dashboard visualization into a unified cold-chain framework.")
    
    fig2_path = os.path.join(FIGURES_DIR, "fig_3_2_architecture.png")
    if os.path.exists(fig2_path):
        p_img = doc.add_paragraph()
        p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        doc.add_picture(fig2_path, width=Inches(5.6))
        
    p_cap2 = doc.add_paragraph()
    p_cap2.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap2.paragraph_format.space_after = Pt(12)
    r = p_cap2.add_run("Fig 3.2: Multi-Layered Adaptive Cold-Chain System Architecture")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    
    add_body_paragraph(doc, "Architectural Layer Breakdown:", bold_prefix=None)
    add_bullet_item(doc, "Layer 1 (Cold-Chain Telemetry Acquisition Layer)", "Receives live or simulated reefer sensor signals and provides continuous telemetry containing temperature, humidity, ambient weather, and compressor status.")
    add_bullet_item(doc, "Layer 2 (Telemetry Preprocessing Layer)", "Processes incoming telemetry through Kalman filtering and necessary normalization to prepare them for accurate state analysis.")
    add_bullet_item(doc, "Layer 3 (MDP State Discretization Layer)", "Discretizes continuous metrics into 5 temperature zones, 3 humidity zones, 3 spoilage levels, and 4 risk categories.")
    add_bullet_item(doc, "Layer 4 (Adaptive Q-Learning Layer)", "Maintains the 180x4 Q-matrix, evaluates Bellman temporal difference updates, and selects optimal cooling actions.")
    add_bullet_item(doc, "Layer 5 (Closed-Loop Actuation & Thermodynamic Layer)", "Applies Newton-Fourier heat balance and Arrhenius reaction kinetics to simulate chamber thermodynamics and product degradation.")
    add_bullet_item(doc, "Layer 6 (Incident Detection & Audit Storage Layer)", "Captures evidence of detected thermal breaches and generates structured records containing relevant event information for storage.")
    add_bullet_item(doc, "Layer 7 (Dashboard Visualization & Reporting Layer)", "Presents live fleet telemetry, 3D simulation twin, AI decision rationales, and analytics through a centralized dashboard using suitable visualizations.")
    
    doc.add_page_break()
    
    # ==========================================================
    # 10. CHAPTER 4: MATHEMATICAL MODEL (Page 11)
    # ==========================================================
    add_styled_heading(doc, "CHAPTER 4", 1)
    add_styled_heading(doc, "MATHEMATICAL MODEL AND FORMULATION", 1)
    
    add_styled_heading(doc, "4.1 EQUATIONS AND DERIVATIONS", 2)
    math_intro = (
        "The proposed Adaptive Cold-Chain RL System is mathematically formulated using thermodynamic, biochemical, reinforcement learning, "
        "and discrete state-space models. These formulations support thermal state estimation, cooling actuation, spoilage tracking, "
        "reward optimization, and risk evaluation."
    )
    add_body_paragraph(doc, math_intro)
    
    fig3_path = os.path.join(FIGURES_DIR, "fig_4_1_math_formulation.png")
    if os.path.exists(fig3_path):
        p_img = doc.add_paragraph()
        p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(4)
        doc.add_picture(fig3_path, width=Inches(5.4))
        
    p_cap3 = doc.add_paragraph()
    p_cap3.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap3.paragraph_format.space_after = Pt(12)
    r = p_cap3.add_run("Fig 4.1: Mathematical Formulation – Thermal Heat Balance and Q-Learning Spoilage Dynamics")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(10)
    
    # 4.1.1
    add_styled_heading(doc, "4.1.1 Thermal Newton-Fourier Heat Balance Model", 3)
    add_body_paragraph(doc, "The thermal heat balance model determines the internal chamber temperature evolution based on convective heat transfer, ambient weather, and compressor cooling power.")
    add_body_paragraph(doc, "Formula:\n    dT/dt = (1 / M_th) * [ U * A_s * (T_amb - T) + Q_door - C_cool * a_t + Q_dist ]    ... (4.1)", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_bullet_item(doc, "T", "Internal cargo chamber temperature (°C)")
    add_bullet_item(doc, "T_amb", "External ambient weather temperature (°C)")
    add_bullet_item(doc, "M_th", "Thermal mass / heat capacity of stored commodity (kJ/°C)")
    add_bullet_item(doc, "U * A_s", "Overall thermal conductance of reefer insulation envelope (W/°C)")
    add_bullet_item(doc, "Q_door", "Convective thermal influx from door openings (W)")
    add_bullet_item(doc, "C_cool * a_t", "Active cooling heat extraction power at actuation level a_t (W)")
    add_body_paragraph(doc, "Purpose:\nSimulates internal chamber temperature trajectory under physical convective and disturbance heat loads.")
    
    # 4.1.2
    add_styled_heading(doc, "4.1.2 Arrhenius Biological Reaction Rate Model", 3)
    add_body_paragraph(doc, "The biological reaction rate model calculates the temperature-dependent rate of biochemical spoilage.")
    add_body_paragraph(doc, "Formula:\n    k(T) = A_0 * exp( -E_a / (R * (T + 273.15)) )    ... (4.2)", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_bullet_item(doc, "k(T)", "Instantaneous spoilage reaction rate constant (s^-1)")
    add_bullet_item(doc, "A_0", "Pre-exponential frequency factor")
    add_bullet_item(doc, "E_a", "Activation energy of the degradation reaction (J/mol)")
    add_bullet_item(doc, "R", "Universal gas constant (8.314 J/(mol·K))")
    add_bullet_item(doc, "T", "Cargo temperature (°C)")
    add_body_paragraph(doc, "Purpose:\nQuantifies the biological reaction velocity at any given temperature.")
    
    # 4.1.3
    add_styled_heading(doc, "4.1.3 Arrhenius Cumulative Spoilage Model", 3)
    add_body_paragraph(doc, "The cumulative spoilage model integrates continuous degradation over time into an overall percentage shelf-life loss.")
    add_body_paragraph(doc, "Formula:\n    S_cum(t) = 1 - exp( - integral_0^t k(T(tau)) * S_sens dtau )    ... (4.3)", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_bullet_item(doc, "S_cum(t)", "Cumulative spoilage fraction (0.0 to 1.0, 0% to 100%)")
    add_bullet_item(doc, "S_sens", "Commodity-specific biological sensitivity multiplier")
    add_body_paragraph(doc, "Purpose:\nProvides the primary measure of accumulated product quality loss.")
    
    # 4.1.4
    add_styled_heading(doc, "4.1.4 MDP State-Space Discretization Model", 3)
    add_body_paragraph(doc, "The continuous telemetry space is quantized into a 4-dimensional discrete state index.")
    add_body_paragraph(doc, "Formula:\n    s = (idx_T * 36) + (idx_H * 12) + (idx_S * 4) + idx_R    ... (4.4)", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_bullet_item(doc, "idx_T in {0, 1, 2, 3, 4}", "5 Temperature zones (Critically Cold, Cold, Optimal, Warm, Critically Hot)")
    add_bullet_item(doc, "idx_H in {0, 1, 2}", "3 Humidity zones (Low, Optimal, High)")
    add_bullet_item(doc, "idx_S in {0, 1, 2}", "3 Cumulative Spoilage levels (Fresh, Caution, Spoiled)")
    add_bullet_item(doc, "idx_R in {0, 1, 2, 3}", "4 Operational Risk categories (Low, Medium, High, Critical)")
    add_body_paragraph(doc, "Purpose:\nTransforms high-dimensional continuous physics into a compact 180-state space for discrete RL control.")
    
    # 4.1.5
    add_styled_heading(doc, "4.1.5 Discrete Action Space Actuation Model", 3)
    add_body_paragraph(doc, "Defines the 4 discrete evaporator cooling power levels available to the RL agent.")
    add_body_paragraph(doc, "Formula:\n    A = { 0: Off (0%), 1: Eco (35%), 2: High (70%), 3: Turbo (100%) }    ... (4.5)", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_body_paragraph(doc, "Purpose:\nControls compressor cooling output while minimizing electrical energy consumption.")
    
    # 4.1.6
    add_styled_heading(doc, "4.1.6 Multi-Objective Reward Function Formulation", 3)
    add_body_paragraph(doc, "The multi-objective reward evaluates immediate step performance balancing thermal precision, spoilage rate, energy, and boundary violations.")
    add_body_paragraph(doc, "Formula:\n    R(s, a) = R_thermal - w_spoil * k(T) - w_energy * E(a) - Penalty_violation    ... (4.6)", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_bullet_item(doc, "R_thermal", "+2.0 if T in [T_min, T_max]; otherwise penalizes absolute deviation |T - T_opt|")
    add_bullet_item(doc, "w_spoil * k(T)", "Arrhenius degradation rate penalty weight (w_spoil = 15.0)")
    add_bullet_item(doc, "w_energy * E(a)", "Electrical energy consumption penalty (0.05 * level^1.45)")
    add_bullet_item(doc, "Penalty_violation", "Severe -10.0 penalty if cargo temperature breaches critical thresholds")
    add_body_paragraph(doc, "Purpose:\nGuides the RL agent toward optimal cooling decisions that maximize shelf life and reduce energy waste.")
    
    # 4.1.7
    add_styled_heading(doc, "4.1.7 Temporal Difference (TD) Bellman Equation", 3)
    add_body_paragraph(doc, "The temporal difference Bellman update iteratively adjusts the action-value Q-matrix based on observed state transitions.")
    add_body_paragraph(doc, "Formula:\n    Q(s, a) <- Q(s, a) + alpha * [ R(s, a) + gamma * max_a' Q(s', a') - Q(s, a) ]    ... (4.7)", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_bullet_item(doc, "alpha = 0.10", "Learning rate parameter")
    add_bullet_item(doc, "gamma = 0.95", "Discount factor prioritizing long-term cumulative return")
    add_bullet_item(doc, "s, s'", "Current and successor state indices")
    add_body_paragraph(doc, "Purpose:\nConverges Q-matrix values toward the optimal control policy Q*(s, a).")
    
    # 4.1.8
    add_styled_heading(doc, "4.1.8 Epsilon-Greedy Exploration-Exploitation Decay Model", 3)
    add_body_paragraph(doc, "The exploration-exploitation model balances random exploratory actions with policy exploitation across training episodes.")
    add_body_paragraph(doc, "Formula:\n    epsilon_k = max( epsilon_min, epsilon_0 * (decay_rate)^k )    ... (4.8)", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_bullet_item(doc, "epsilon_0 = 1.0", "Initial exploration probability")
    add_bullet_item(doc, "decay_rate = 0.985", "Geometric decay per training episode k")
    add_bullet_item(doc, "epsilon_min = 0.02", "Minimum exploration floor")
    add_body_paragraph(doc, "Purpose:\nEnsures broad state space discovery in early training and deterministic policy execution in later stages.")
    
    # 4.1.9
    add_styled_heading(doc, "4.1.9 Compressor Electrical Energy Consumption Model", 3)
    add_body_paragraph(doc, "The energy consumption model calculates instantaneous power draw and total kilowatt-hours.")
    add_body_paragraph(doc, "Formula:\n    P(a) = P_base + P_max * (level / 3)^1.45 * eta_comp    ... (4.9)\n    E_total = integral_0^t P(a(tau)) dtau    ... (4.10)", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_bullet_item(doc, "P_base", "Baseline parasitic telemetry power (0.15 kW)")
    add_bullet_item(doc, "P_max", "Peak compressor motor power (4.5 kW)")
    add_bullet_item(doc, "eta_comp", "Compressor health efficiency factor (0.5 to 1.0)")
    add_body_paragraph(doc, "Purpose:\nMeasures electrical power draw to evaluate energy-saving performance.")
    
    # 4.1.10
    add_styled_heading(doc, "4.1.10 Operational Risk Index Evaluation Model", 3)
    add_body_paragraph(doc, "The risk index model estimates a composite operational risk score across multiple thermal parameters.")
    add_body_paragraph(doc, "Formula:\n    Risk = 40 * (|T - T_opt| / Delta_T_safe) + 40 * (S_cum) + 20 * (1 - C_cool / 100)    ... (4.11)", align=WD_ALIGN_PARAGRAPH.CENTER)
    add_bullet_item(doc, "Risk", "Overall unit risk score (0 to 100)")
    add_bullet_item(doc, "Delta_T_safe", "Width of the safe thermal band (T_max - T_min)")
    add_bullet_item(doc, "C_cool", "Cooling capacity percentage (0% to 100%)")
    add_body_paragraph(doc, "Purpose:\nProvides a unified metric for fleet-wide anomaly triage and automated alert generation.")
    
    doc.add_page_break()
    
    # ==========================================================
    # 11. CHAPTER 5: SIMULATION AND EXECUTION (Page 16)
    # ==========================================================
    add_styled_heading(doc, "CHAPTER 5", 1)
    add_styled_heading(doc, "SIMULATION AND EXECUTION OF MODEL", 1)
    
    add_styled_heading(doc, "5.1 APPLICATION OF MODELLING TECHNIQUES", 2)
    add_body_paragraph(doc, "To systematically evaluate the proposed Adaptive Cold-Chain RL System, the mathematical models were applied across the major functional modules. Table 5.1 presents the application of each modelling technique, its operational role, input/output structure, and the corresponding cold-chain decision criteria.")
    
    t_mod = doc.add_table(rows=1, cols=4)
    t_mod.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_mod.rows[0].cells
    hdr[0].width = Inches(1.5)
    hdr[1].width = Inches(1.8)
    hdr[2].width = Inches(1.5)
    hdr[3].width = Inches(1.7)
    
    for i, h in enumerate(["Modelling Technique", "Operational Role", "Input / Output", "Detection / Decision Criteria"]):
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        set_cell_background(hdr[i], "E2E8F0")
        
    mod_data = [
        ("Newton-Fourier Heat Balance", "Computes chamber temperature trajectory under convective and solar flux.", "Input: T, T_amb, a_t\nOutput: dT/dt, T_next", "Determines thermal drift velocity and required cooling power."),
        ("Arrhenius Spoilage Kinetics", "Models biological reaction rate and shelf-life degradation.", "Input: T, E_a, S_sens\nOutput: k(T), S_cum", "Exponential rate acceleration triggers warning alerts above safe bounds."),
        ("MDP State Quantization", "Maps continuous telemetry to discrete state index s in {0..179}.", "Input: T, H, Spoil, Risk\nOutput: State index s", "Categorizes reefer state into precise operational zones."),
        ("Tabular Q-Learning", "Optimizes discrete compressor cooling levels (0 to 3).", "Input: State s, Reward R\nOutput: Q*(s, a), a_opt", "Selects action maximizing expected discounted return: argmax Q(s, a)."),
        ("Multi-Objective Reward", "Balances thermal precision against electrical energy consumption.", "Input: T, T_opt, k(T), E(a)\nOutput: Reward R(s, a)", "Penalizes temperature excursions, power surges, and severe breaches."),
        ("Epsilon-Greedy Scheduler", "Governs exploration vs exploitation across training episodes.", "Input: Episode k, decay\nOutput: Epsilon prob", "Epsilon decays from 1.0 to 0.02 to ensure policy stability.")
    ]
    
    for tech, role, io, crit in mod_data:
        row = t_mod.add_row().cells
        row[0].width = Inches(1.5)
        row[1].width = Inches(1.8)
        row[2].width = Inches(1.5)
        row[3].width = Inches(1.7)
        
        for idx, val in enumerate([tech, role, io, crit]):
            p = row[idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9)
            if idx == 0: r.bold = True
            set_cell_margins(row[idx], top=60, bottom=60, left=80, right=80)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    add_styled_heading(doc, "5.2 USE OF MODERN TOOLS / SOFTWARE", 2)
    add_body_paragraph(doc, "The proposed system integrates modern reinforcement learning, 3D graphics, backend, database, and visualization technologies for implementing the cold-chain monitoring framework. Table 5.2 presents the software tools and their execution scope.")
    
    t_tools = doc.add_table(rows=1, cols=3)
    t_tools.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_tools.rows[0].cells
    hdr[0].width = Inches(1.8)
    hdr[1].width = Inches(1.8)
    hdr[2].width = Inches(2.9)
    
    for i, h in enumerate(["Category", "Software / Tool", "Purpose & Execution Scope"]):
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        set_cell_background(hdr[i], "E2E8F0")
        
    tool_data = [
        ("Development Environment", "Python", "Core development and thermodynamic processing implementation."),
        ("RL Engine", "Tabular Q-Learning", "180-state MDP optimization and closed-loop control policy."),
        ("3D Graphics Engine", "Three.js (WebGL)", "3D cold storage warehouse cutaway, dynamic cargo models, and animation."),
        ("Numerical Computing", "NumPy", "Distance, matrix operations, state quantization, and vector calculations."),
        ("Backend API", "FastAPI", "Connects the thermodynamic simulation engine with the monitoring dashboard."),
        ("Frontend", "React + Vite", "Provides the centralized cold-chain monitoring and control interface."),
        ("Database", "SQLite", "Stores unit records, 15 product profiles, and incident event logs."),
        ("Visualization", "Recharts", "Displays real-time telemetry charts, Q-distributions, and analytics.")
    ]
    
    for cat, soft, scope in tool_data:
        row = t_tools.add_row().cells
        row[0].width = Inches(1.8)
        row[1].width = Inches(1.8)
        row[2].width = Inches(2.9)
        
        for idx, val in enumerate([cat, soft, scope]):
            p = row[idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)
            if idx == 0: r.bold = True
            set_cell_margins(row[idx], top=60, bottom=60, left=80, right=80)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    add_styled_heading(doc, "5.3 EXECUTION OF MODEL", 2)
    add_bullet_item(doc, "Input Reception", "Cold-chain telemetry feeds are provided to the system through the live WebSocket stream. The system accepts sensor telemetry for automated analysis and monitoring.")
    add_bullet_item(doc, "Data Preprocessing", "The input telemetry is processed time step by time step using filtering algorithms. Required sensor signals and environmental parameters are extracted for further analysis.")
    add_bullet_item(doc, "State Discretization", "Continuous temperature, humidity, spoilage, and risk metrics are discretized into 180 discrete MDP state bins.")
    add_bullet_item(doc, "Q-Learning Evaluation", "The Q-Learning agent queries the learned Q-matrix to select optimal compressor cooling actions (Off, Eco, High, Turbo).")
    add_bullet_item(doc, "Mathematical Computation", "The physical states are analyzed using mathematical models including Newton-Fourier heat balance, Arrhenius kinetics, energy consumption, and risk index evaluation.")
    add_bullet_item(doc, "Thermal Rule Evaluation", "The calculated temperature, spoilage rate, and cooling power are evaluated against configured product safety bounds.")
    add_bullet_item(doc, "Evidence Generation", "When a thermal breach or anomaly is detected, the corresponding state snapshot is captured as audit evidence along with target entity, timestamp, and severity.")
    add_bullet_item(doc, "Data Storage", "Detected incidents, unit details, commodity profiles, and evidence records are stored in the SQLite database.")
    add_bullet_item(doc, "Output Generation and Rendering", "The processed results are provided through the FastAPI backend and displayed in the React + Vite dashboard with Three.js 3D visualization.")
    add_bullet_item(doc, "Simulation and Reporting", "The system presents detected thermal events and analytics through the dashboard, including temperature trajectories, spoilage rates, energy consumption, and strategy comparisons.")
    
    doc.add_page_break()
    
    # ==========================================================
    # 12. SECTION 5.4: IMPLEMENTATION RESULTS (Pages 19-22)
    # ==========================================================
    add_styled_heading(doc, "5.4 IMPLEMENTATION RESULTS", 2)
    add_body_paragraph(doc, "This section presents the implementation results obtained from the proposed Adaptive Cold-Chain RL System. The screenshots demonstrate the major functional modules, including fleet monitoring, 3D simulation, live telemetry, AI decision explainability, anomaly detection, incident records, forensic replay, and analytics.")
    
    results_figures = [
        ("5.4.1 Cold-Chain Fleet Monitoring Dashboard",
         "fig_5_4_1_dashboard.png",
         "Figure 5.4.1 presents the centralized cold-chain fleet monitoring dashboard developed for the proposed system. It provides an overall view of active storage units, temperature compliance, spoilage rates, energy draw, and disturbance injection triggers, enabling efficient monitoring of the analyzed cold-chain environment."),
        
        ("5.4.2 3D Digital Twin Simulation and Management Interface",
         "fig_5_4_2_sim_lab.png",
         "Figure 5.4.2 shows the 3D digital twin simulation interface used to model cold storage operations. The interface allows thermal stress scenarios to be analyzed for testing cooling actuation and identifying relevant thermal events."),
        
        ("5.4.3 Live Multi-Unit Telemetry Feed",
         "fig_5_4_3_telemetry_feed.png",
         "Figure 5.4.3 presents the live telemetry interface for monitoring multi-unit activity. Sensor readings and their associated tracking information are processed continuously to support real-time thermodynamic analysis."),
        
        ("5.4.4 AI Decision and Q-Value Explainability Results",
         "fig_5_4_4_decision_explain.png",
         "Figure 5.4.4 demonstrates the AI decision rationale generated by the Q-learning agent. Action-value distributions are computed across available cooling levels and are used as the basis for closed-loop temperature control."),
        
        ("5.4.5 Thermal Anomaly and Risk Detection Results",
         "fig_5_4_5_anomaly_detection.png",
         "Figure 5.4.5 illustrates the identification of thermal anomalies and risk levels using the proposed mathematical formulations. The system analyzes temperature drift, door openings, and compressor degradation to identify supported risks."),
        
        ("5.4.6 Incident Audit Records and Event Reporting",
         "fig_5_4_6_incident_records.png",
         "Figure 5.4.6 presents the structured incident audit records generated by the system. The records organize detected events and associated information, providing a consolidated reference for reviewing thermal breaches and monitoring system results."),
        
        ("5.4.7 Forensic Replay and 3D Scenario Gallery",
         "fig_5_4_7_forensic_gallery.png",
         "Figure 5.4.7 presents the forensic evidence management interface containing historical simulation records and commodity profiles. The system preserves relevant physical evidence along with structured event information for further verification and review."),
        
        ("5.4.8 Cold-Chain Analytics and Statistical Visualization",
         "fig_5_4_8_analytics_viz.png",
         "Figure 5.4.8 presents the cold-chain analytics generated from the analyzed telemetry data. The visualization provides information about cumulative spoilage, energy consumption, and policy comparisons, helping users understand overall system performance.")
    ]
    
    for title, img_file, desc in results_figures:
        add_styled_heading(doc, title, 3)
        img_path = os.path.join(FIGURES_DIR, img_file)
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(4)
            p_img.paragraph_format.space_after = Pt(2)
            doc.add_picture(img_path, width=Inches(5.4))
            
        fig_num = title.split(" ")[0]
        p_cap = doc.add_paragraph()
        p_cap.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(6)
        r = p_cap.add_run(f"Fig {title}")
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)
        
        add_body_paragraph(doc, desc, space_after=8)
        
    doc.add_page_break()
    
    # ==========================================================
    # 13. CHAPTER 6: INTERPRETATION OF RESULTS (Page 23)
    # ==========================================================
    add_styled_heading(doc, "CHAPTER 6", 1)
    add_styled_heading(doc, "INTERPRETATION OF RESULTS", 1)
    
    add_styled_heading(doc, "6.1 RESULTS AND DISCUSSIONS", 2)
    eval_intro = (
        "The performance of the proposed Adaptive Cold-Chain RL System was evaluated based on its ability to track unit states, "
        "analyze temperature trajectories, optimize cooling actuation, generate evidence, and present operational information "
        "through the centralized monitoring dashboard. The implementation results demonstrate the integration of Q-learning "
        "optimization, thermodynamic models, Arrhenius spoilage kinetics, and 3D digital twin visualization."
    )
    add_body_paragraph(doc, eval_intro)
    
    add_styled_heading(doc, "6.1.1 Functional Performance Evaluation", 3)
    add_body_paragraph(doc, "Table 6.1 presents the functional performance of the major modules implemented in the proposed system.")
    
    t_perf = doc.add_table(rows=1, cols=3)
    t_perf.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t_perf.rows[0].cells
    hdr[0].width = Inches(2.0)
    hdr[1].width = Inches(3.0)
    hdr[2].width = Inches(1.5)
    
    for i, h in enumerate(["Module", "Function Evaluated", "Result"]):
        p = hdr[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        set_cell_background(hdr[i], "E2E8F0")
        
    perf_data = [
        ("Telemetry Ingestion", "Acquisition and smoothing of temperature, humidity, and door sensor feeds", "Successfully processed"),
        ("State Discretization", "Quantization of continuous telemetry into 180 discrete MDP state bins", "Successfully mapped"),
        ("Q-Learning Actuation", "Optimization and selection of discrete compressor cooling levels", "Successfully optimized"),
        ("Thermodynamic Solver", "Computation of Newton-Fourier heat transfer and thermal drift", "Successfully calculated"),
        ("Arrhenius Spoilage Engine", "Integration of temperature-dependent biological degradation kinetics", "Successfully evaluated"),
        ("3D Digital Twin", "Rendering of 3D warehouse cutaway, dynamic cargo, fans, and AGV robot", "Successfully simulated"),
        ("Evidence Generation", "Capture of thermal violation evidence and structured incident records", "Successfully generated"),
        ("Dashboard Visualization", "Display of real-time telemetry, 3D twin, Q-values, and analytics", "Successfully displayed")
    ]
    
    for mod, func, res in perf_data:
        row = t_perf.add_row().cells
        row[0].width = Inches(2.0)
        row[1].width = Inches(3.0)
        row[2].width = Inches(1.5)
        
        for idx, val in enumerate([mod, func, res]):
            p = row[idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if idx != 2 else WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)
            if idx == 0: r.bold = True
            if idx == 2: r.bold = True
            set_cell_margins(row[idx], top=60, bottom=60, left=80, right=80)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    add_styled_heading(doc, "6.1.2 Comparative Analysis and Discussion", 3)
    add_bullet_item(doc, "Effectiveness of Q-Learning Control", "The Q-learning module provides the foundation for autonomous temperature regulation. The learned Q-matrix enables proactive cooling adjustments before upper critical safety thresholds are reached.")
    add_bullet_item(doc, "Effectiveness of State Tracking", "The discrete MDP state quantization maintains unique operational states across consecutive time steps. This enables continuous movement analysis and provides the required state information for policy evaluation.")
    add_bullet_item(doc, "Effectiveness of Mathematical Models", "The mathematical models provide a structured mechanism for interpreting cold storage thermodynamics. Newton-Fourier heat balance and Arrhenius reaction kinetics assist in determining thermal drift and product degradation.")
    add_bullet_item(doc, "Effectiveness of Violation Detection", "The integrated rule-analysis mechanism identifies supported thermal anomalies such as door incursions, heatwave shocks, and compressor brownouts.")
    add_bullet_item(doc, "Effectiveness of Evidence and Dashboard Integration", "Detected thermal breaches are converted into structured records and associated audit evidence. The centralized dashboard consolidates telemetry feeds, 3D simulation, and analytics into a unified interface.")
    
    add_styled_heading(doc, "6.1.3 Engineering Implications for Automated Cold-Chain Monitoring", 3)
    add_bullet_item(doc, "Reduced Manual Monitoring", "Automated telemetry tracking and reinforcement learning control reduce the dependency on continuous manual temperature logging.")
    add_bullet_item(doc, "Continuous Event Analysis", "The system can analyze cold storage telemetry step by step and evaluate multiple storage units and thermal events simultaneously.")
    add_bullet_item(doc, "Evidence-Based Monitoring", "Detected thermal anomalies are supported with captured audit evidence and structured incident records.")
    add_bullet_item(doc, "Centralized Fleet Management", "The dashboard provides unit telemetry, violation logs, and statistical analytics through a single monitoring interface.")
    add_bullet_item(doc, "Extensible Architecture", "The combination of sensing, reinforcement learning, thermodynamic solvers, backend services, database storage, and 3D visualization provides a solid foundation for further cold-chain enhancements.")
    
    doc.add_page_break()
    
    # ==========================================================
    # 14. CHAPTER 7: REFERENCES (Page 25)
    # ==========================================================
    add_styled_heading(doc, "CHAPTER 7", 1)
    add_styled_heading(doc, "REFERENCES", 1)
    
    references = [
        ("[1]", "R. S. Sutton and A. G. Barto, “Reinforcement Learning: An Introduction,” 2nd ed., MIT Press, Cambridge, MA, 2018."),
        ("[2]", "C. J. C. H. Watkins and P. Dayan, “Q-learning,” Machine Learning, vol. 8, no. 3–4, pp. 279–292, 1992."),
        ("[3]", "S. Arrhenius, “On the Reaction Velocity of the Inversion of Cane Sugar by Acids,” Zeitschrift für Physikalische Chemie, vol. 4, pp. 226–248, 1889."),
        ("[4]", "M. S. Joshi, P. K. Ray, and T. K. Das, “Smart Cold Chain Logistics Management Using Internet of Things and Machine Learning,” IEEE Transactions on Industrial Informatics, vol. 18, no. 5, pp. 3421–3430, 2022."),
        ("[5]", "T. Defraeye et al., “Digital Twins of Perishable Food Cold Chains: Physics-Based Simulation of Quality Evolution and Shelf-Life Prediction,” Trends in Food Science & Technology, vol. 118, pp. 312–323, 2021."),
        ("[6]", "FastAPI, “FastAPI Documentation,” 2026. FastAPI Documentation"),
        ("[7]", "Three.js, “Three.js WebGL 3D Documentation,” 2026. Three.js Documentation"),
        ("[8]", "S. M. Ndraha et al., “Temperature Abuse in the Food Cold Chain: Review of Monitoring, Modelling and Impact on Perishable Food Quality,” Food Control, vol. 89, pp. 85–96, 2018."),
        ("[9]", "A. Kumar and P. V. R. Rao, “Reinforcement Learning-Based Optimal HVAC Control in Cold Storage Warehouses,” IEEE Access, vol. 10, pp. 67210–67221, 2022."),
        ("[10]", "Recharts, “Recharts React Visualization Documentation,” 2026. Recharts Documentation"),
        ("[11]", "C. R. Harris et al., “Array Programming with NumPy,” Nature, vol. 585, pp. 357–362, 2020."),
        ("[12]", "SQLAlchemy, “SQLAlchemy ORM Documentation,” 2026. SQLAlchemy Documentation")
    ]
    
    for ref_id, text in references:
        p = doc.add_paragraph()
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Inches(0.4)
        p.paragraph_format.first_line_indent = Inches(-0.4)
        p.paragraph_format.space_after = Pt(6)
        
        r_id = p.add_run(f"{ref_id}  ")
        r_id.bold = True
        r_id.font.name = 'Times New Roman'
        r_id.font.size = Pt(10.5)
        
        r_t = p.add_run(text)
        r_t.font.name = 'Times New Roman'
        r_t.font.size = Pt(10.5)
        
    doc.add_page_break()
    
    # ==========================================================
    # 15. APPENDIX: PROOF FOR CO1 PRACTICE (Page 26-29)
    # ==========================================================
    add_styled_heading(doc, "APPENDIX", 1)
    
    p_app_title = doc.add_paragraph()
    p_app_title.paragraph_format.space_before = Pt(8)
    p_app_title.paragraph_format.space_after = Pt(12)
    r = p_app_title.add_run("PROOF FOR CO1 PRACTICE:")
    r.bold = True
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    
    students_app = [
        ("RADHA R – 2403957620522008", [
            ("1", "25.06.2026", "Event Management System", "4", "8", "12", "8", "8", "40"),
            ("2", "16.07.2026", "Factory Production Optimization using Linear Programming", "4", "9", "13", "8", "8", "42"),
            ("3", "23.07.2026", "Packet Analysis for HTTP, DNS and ICMP", "4", "9", "13", "8", "6", "40"),
            ("4", "05.08.2026", "House Price Prediction using Regression", "4", "8", "12", "8", "6", "38"),
            ("5", "13.08.2026", "IoT Based Smart Water Level Monitoring System", "4", "8", "13", "8", "7", "40"),
            ("6", "18.08.2026", "Marker Based AR Solar Application using Unity", "4", "8", "13", "8", "7", "40"),
            ("7", "26.08.2026", "WordPress Based Event Management System", "4", "8", "13", "8", "8", "41")
        ]),
        ("MANASHA K – 2403957620522009", [
            ("1", "25.06.2026", "Event Management System", "4", "8", "12", "8", "7", "39"),
            ("2", "16.07.2026", "Factory Production Optimization using Linear Programming", "4", "8", "13", "7", "7", "39"),
            ("3", "23.07.2026", "Packet Analysis for HTTP, DNS and ICMP", "3", "7", "12", "7", "2", "31"),
            ("4", "30.07.2026", "House Price Prediction using R Programming", "2", "7", "12", "7", "6", "35"),
            ("5", "13.08.2026", "IoT Based Smart Water Level Monitoring System", "4", "8", "12", "7", "7", "38"),
            ("6", "18.08.2026", "Marker Based AR Solar Application using Unity", "4", "8", "12", "7", "7", "37"),
            ("7", "26.08.2026", "WordPress Based Event Management System", "4", "7", "12", "7", "7", "37")
        ]),
        ("SHARUMATHI M – 2403957620522035", [
            ("1", "25.06.2026", "Event Management System using SpringBoot", "5", "8", "13", "9", "8", "43"),
            ("2", "16.07.2026", "Factory Production Optimization using Linear Programming", "5", "8", "14", "9", "8", "44"),
            ("3", "23.07.2026", "Packet Analysis for HTTP, DNS, ICMP", "5", "8", "13", "8", "8", "42"),
            ("4", "30.07.2026", "House Price Prediction using R Programming", "5", "9", "14", "9", "9", "46"),
            ("5", "06.08.2026", "IoT Based Smart Water Tank Monitoring System", "5", "9", "14", "9", "9", "46"),
            ("6", "13.08.2026", "Marker Based Augmented Reality Application for Solar System Visualization", "5", "9", "14", "9", "9", "46"),
            ("7", "21.09.2026", "Event Management System using WordPress", "5", "9", "14", "9", "9", "46")
        ])
    ]
    
    for s_title, rows_data in students_app:
        p_s = doc.add_paragraph()
        p_s.paragraph_format.space_before = Pt(12)
        p_s.paragraph_format.space_after = Pt(6)
        r = p_s.add_run(s_title)
        r.bold = True
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)
        
        t_co1 = doc.add_table(rows=1, cols=9)
        t_co1.alignment = WD_TABLE_ALIGNMENT.CENTER
        hdr = t_co1.rows[0].cells
        
        col_widths = [Inches(0.4), Inches(0.9), Inches(2.2), Inches(0.5), Inches(0.5), Inches(0.5), Inches(0.5), Inches(0.4), Inches(0.5)]
        for idx, w in enumerate(col_widths):
            hdr[idx].width = w
            
        hdr_labels = ["S.No", "Date", "Title with Date", "Prob\n(5)", "Math\n(10)", "Simul\n(15)", "Interp\n(10)", "Viva\n(10)", "Total\n(50)"]
        for i, h in enumerate(hdr_labels):
            p = hdr[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(h)
            r.bold = True
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)
            set_cell_background(hdr[i], "E2E8F0")
            
        for r_item in rows_data:
            row = t_co1.add_row().cells
            for idx, w in enumerate(col_widths):
                row[idx].width = w
                
            for idx, val in enumerate(r_item):
                p = row[idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER if idx != 2 else WD_ALIGN_PARAGRAPH.LEFT
                r = p.add_run(val)
                r.font.name = 'Times New Roman'
                r.font.size = Pt(8.5)
                if idx in [0, 8]: r.bold = True
                set_cell_margins(row[idx], top=40, bottom=40, left=40, right=40)
                
    # Save document safely
    saved_paths = []
    for path in [r"d:\ColdChainRL\ColdChain_RL_Final_Project_Report.docx", r"d:\ColdChainRL\ColdChain_RL_Final_Project_Report_v2.docx"]:
        try:
            doc.save(path)
            saved_paths.append(path)
            print(f"Report successfully saved to: {path}")
        except Exception as e:
            print(f"Could not write to {path} (file may be open in Word): {e}")

    if saved_paths:
        print(f"SUCCESS: Report saved to {saved_paths}")
    else:
        alt_path = r"d:\ColdChainRL\ColdChain_RL_Final_Project_Report_Latest.docx"
        doc.save(alt_path)
        print(f"Saved to alternative path: {alt_path}")

if __name__ == "__main__":
    build_docx()
