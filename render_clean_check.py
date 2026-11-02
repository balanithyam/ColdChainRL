from docx2pdf import convert
import fitz

docx_path = r'd:\ColdChainRL\Coldchain final corrected report-1.docx'
pdf_path = r'd:\ColdChainRL\Coldchain_clean_test.pdf'

print('Converting to PDF via Word COM...')
convert(docx_path, pdf_path)
print('PDF conversion complete.')

doc = fitz.open(pdf_path)
print('Total PDF pages:', len(doc))

for p_num in range(1, 8):
    page = doc[p_num - 1]
    pix = page.get_pixmap(dpi=150)
    pix.save(f'd:/ColdChainRL/clean_p{p_num}.png')
    print(f'Page {p_num}: {page.rect.width}x{page.rect.height}')

print('Pages 1-7 rendered to clean_p*.png')
