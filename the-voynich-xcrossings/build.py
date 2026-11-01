from pathlib import Path
import json, hashlib
ROOT = Path(__file__).resolve().parent
source = (ROOT / 'manuscript.md').read_text(encoding='utf-8')
story = {'title':'The Voynich XCrossings', 'edition':'全六部・第2稿', 'version':hashlib.sha256(source.encode()).hexdigest()[:16], 'markdown':source}
html = (ROOT / 'src/template.html').read_text()
for marker, value in {
 '/*__CSS__*/':(ROOT/'src/reader.css').read_text(),
 '/*__STORY__*/':json.dumps(story,ensure_ascii=False).replace('<',chr(92)+'u003c'),
 '/*__CORE__*/':(ROOT/'src/reader-core.js').read_text(),
 '/*__APP__*/':(ROOT/'src/app.js').read_text()
}.items():
 assert html.count(marker)==1, marker
 html = html.replace(marker,value)
(ROOT/'index.html').write_text(html,encoding='utf-8')
print(json.dumps({'output':'index.html','version':story['version'],'manuscript_characters':len(source),'bytes':len(html.encode())},ensure_ascii=False))
