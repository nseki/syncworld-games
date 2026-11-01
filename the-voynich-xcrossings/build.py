from pathlib import Path
import json, hashlib, html as html_tools
ROOT = Path(__file__).resolve().parent
source = (ROOT / 'manuscript.md').read_text(encoding='utf-8')
story = {'title':'The Voynich XCrossings', 'edition':'第一部〜第四部＋ラーナルート・第3稿', 'version':hashlib.sha256(source.encode()).hexdigest()[:16], 'markdown':source, 'progressVersion':'c1ba2af7557bef9d'}
migrations = json.loads((ROOT / 'reading-migrations.json').read_text())
story.update(progressRevision=migrations['revision'], anchorMigrations=migrations['anchorMigrations'])
story['nextRoute'] = {'url':'./misha/', 'label':'ミーシャルートを読む', 'description':'共通第四部から、別の調査を選んだ展開です。'}
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
misha_source = (ROOT/'misha/manuscript.md').read_text()
misha = {'title':story['title'], 'edition':'ミーシャルート・第3稿（共通第四部から分岐）', 'markdown':misha_source,
 'version':hashlib.sha256(misha_source.encode()).hexdigest()[:16], 'progressVersion':'misha-reader-v1',
 'progressRevision':'misha-v1', 'anchorMigrations':{},
 'returnRoute':{'url':'../','label':'共通部・ラーナルートへ戻る','description':'ミーシャルート・読了'}}
build(misha, ROOT/'misha/index.html')
