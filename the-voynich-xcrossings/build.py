from pathlib import Path
import json, hashlib, html as html_tools
ROOT = Path(__file__).resolve().parent
source = (ROOT / 'manuscript.md').read_text(encoding='utf-8')
story = {'title':'The Voynich XCrossings', 'edition':'共通部第一〜四部・第4稿', 'version':hashlib.sha256(source.encode()).hexdigest()[:16], 'markdown':source, 'progressVersion':'c1ba2af7557bef9d'}
migrations = json.loads((ROOT / 'reading-migrations.json').read_text())
story.update(progressRevision=migrations['revision'], anchorMigrations=migrations['anchorMigrations'])
def build(story, destination):
 base = './' if destination.parent == ROOT else '../'
 story['navigation'] = [{'url':base+target+'?draft=4','label':label} for target,label in [('', '共通部 第一〜四部'),('rana/','ラーナルート'),('misha/','ミーシャルート'),('mio/','澪ルート（トゥルー）'),('ritsu/','律の後日譚')]]

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
story['routes'] = [
 {'url':'./rana/?draft=4', 'label':'ラーナルートを読む', 'description':'共通第四部から、町の設備と地図の調査を進める展開です。'},
 {'url':'./misha/?draft=4', 'label':'ミーシャルートを読む', 'description':'共通第四部から、研究記録の調査を進める別の展開です。'},
 {'url':'./mio/?draft=4','label':'澪ルートを読む','description':'共通第四部から分岐するトゥルールートです。先にラーナ・ミーシャの順で読むことをおすすめします。'}]
build(story, ROOT/'index.html')
for slug, name in [('rana','ラーナ'),('misha','ミーシャ'),('mio','澪'),('ritsu','律')]:
 text = (ROOT/slug/'manuscript.md').read_text()
 route = {'title':story['title'], 'edition':name+'ルート・第4稿（共通第四部から分岐）',
  'markdown':text, 'version':hashlib.sha256(text.encode()).hexdigest()[:16],
  'progressVersion':slug+'-draft4-reader-v1', 'progressRevision':slug+'-draft4-v1', 'anchorMigrations':{},
  'routes':[{'url':'../?draft=4','label':'共通部へ戻る','description':'共通第四部から分岐する独立したルートです。'}]}
 if slug == 'rana':
  route['routes'].insert(0, {'url':'../misha/?draft=4','label':'ミーシャルートを読む','description':'共通第四部から別の調査を選んだ展開です。ラーナルートの続編ではありません。'})
 if slug == 'misha':
  route['routes'].insert(0, {'url':'../mio/?draft=4','label':'澪ルートを読む','description':'共通第四部から別の行動を選んだトゥルールートです。'})
 if slug == 'mio':
  route['routes'].insert(0, {'url':'../ritsu/?draft=4','label':'律の後日譚を読む','description':'澪エンドの後に続くエピローグです。'})
 if slug == 'ritsu':
  route['edition']='律エピローグ・第4稿（澪エンド後）'
 build(route, ROOT/slug/'index.html')
