import docx

doc = docx.Document(r'd:\ColdChainRL\Coldchain final corrected report-1.docx.original_bak')

for i in range(min(10, len(doc.sections))):
    s = doc.sections[i]
    footer = s.footer
    f_text = ''.join(p.text for p in footer.paragraphs).strip()
    f_xml = ''.join(p._p.xml for p in footer.paragraphs)
    pg_num = 'PAGE' in f_xml or 'w:fldSimple' in f_xml or 'w:instrText' in f_xml
    print(f'Section {i}: footer text={f_text!r}, has_page_number_field={pg_num}')
