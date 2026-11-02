import docx

doc = docx.Document(r'd:\ColdChainRL\ColdChain_RL_Final_Project_Report.docx')

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

print(f'Abstract around {start_idx}, Chapter 1 around {end_idx}')
for i in range(start_idx, end_idx + 1):
    child = children[i]
    tag = child.tag.split('}')[-1]
    t = ''.join(child.itertext()).strip()[:40]
    print(f'{i:3d}: <{tag}> text={t!r}')
