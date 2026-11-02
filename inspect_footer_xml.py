import docx

doc = docx.Document(r'd:\ColdChainRL\Coldchain final corrected report-1.docx.original_bak')

for sec_idx in [2, 3, 4, 5, 7]:
    s = doc.sections[sec_idx]
    footer = s.footer
    print(f'=== Section {sec_idx} footer ===')
    for p in footer.paragraphs:
        print('  text:', p.text)
        print('  xml:', p._p.xml[:300])
