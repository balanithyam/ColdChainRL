import docx

doc = docx.Document(r'd:\ColdChainRL\Coldchain final corrected report-1.docx.original_bak')

for i in range(min(12, len(doc.sections))):
    s = doc.sections[i]
    pgNumType = s._sectPr.xpath('./w:pgNumType')
    attribs = pgNumType[0].attrib if pgNumType else 'NONE'
    print(f'Section {i}: pgNumType={attribs}')
