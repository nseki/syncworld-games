from pathlib import Path
import json, hashlib, html as html_tools
ROOT = Path(__file__).resolve().parent
source = (ROOT / 'manuscript.md').read_text(encoding='utf-8')
story = {'title':'The Voynich XCrossings', 'edition':'共通部第一〜四部・第4稿', 'version':hashlib.sha256(source.encode()).hexdigest()[:16], 'markdown':source, 'progressVersion':'c1ba2af7557bef9d'}
migrations = json.loads((ROOT / 'reading-migrations.json').read_text())
story.update(progressRevision=migrations['revision'], anchorMigrations=migrations['anchorMigrations'])
def build(story, destination):
 html = (ROOT / 'src/template.html').read_text().replace('/*__EDITION__*/', html_tools.escape(story['edition']))
 for marker, value in {
  '/*__CSS__*/':(ROOT/'src/reader.css').read_text(),
  '/*__STORY__*/':json.dumps(story,ensure_ascii=False).replace('<',chr(92)+'u003c'),
  '/*__CORE__*/':(ROOT/'src/reader-core.js').read_text(),
  '/*__APP__*/':(ROOT/'src/app.js').read_text()
 }.items():
  assert html.count(marker)==1, marker
  html = html.replace(marker,value)
 destination.write_text(html,encoding='utf-8')
 print(json.dumps({'output':str(destination.relative_to(ROOT)),'version':story['version'],'manuscript_characters':len(story['markdown']),'bytes':len(html.encode())},ensure_ascii=False))
build(story, ROOT/'index.html')
holding = """<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>試読範囲の更新 | The Voynich XCrossings</title><style>body{font-family:system-ui,sans-serif;line-height:1.9;background:#f3f1e9;color:#293630;margin:0}main{max-width:36rem;margin:12vh auto;padding:2rem}a{color:#315740}h1{font-size:1.4rem}</style></head><body><main><h1>試読範囲を更新しました</h1><p>現在は共通部第一〜四部の第4稿を公開しています。個別ルートの試読は、いったんお休みしています。</p><a href="../?draft=4">共通部・第4稿を読む →</a></main></body></html>"""
(ROOT/'misha/index.html').write_text(holding, encoding='utf-8')
