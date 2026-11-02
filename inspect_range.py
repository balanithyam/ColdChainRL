import docx

doc = docx.Document(r'd:\ColdChainRL\Coldchain final corrected report-1.docx')

body = doc._body._body
children = list(body)

start_idx = None
end_idx = None

for i, child in enumerate(children):
    text = ''.join(child.itertext()).strip()
    if 'ABSTRACT' in text and start_idx is None:
        start_idx = i
    if 'CHAPTER 1' in text and end_idx is None:
        end_idx = i

print(f'Abstract starts around element {start_idx}, Chapter 1 starts around element {end_idx}')
for i in range(start_idx, end_idx + 2):
    child = children[i]
    tag = child.tag.split('}')[-1]
    t = ''.join(child.itertext()).strip()[:40]
    sect = child.xpath('.//w:sectPr')
    cols = child.xpath('.//w:cols')
    print(f'{i:3d}: <{tag}> text={t!r} sect={len(sect)} cols={len(cols)}')
