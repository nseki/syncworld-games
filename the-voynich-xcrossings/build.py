from pathlib import Path
import json, hashlib, html as html_tools
ROOT = Path(__file__).resolve().parent
characters = json.loads((ROOT / 'characters.json').read_text(encoding='utf-8'))
def characters_html(heading='h3'):
 esc = html_tools.escape
 content = '<p class="dialog-note">'+esc(characters['note'])+'</p>'
 for group in characters['groups']:
  content += '<section class="character-group"><'+heading+'>'+esc(group['title'])+'</'+heading+'><dl class="character-list">'
  for person in group['people']:
   reading = '<span class="character-reading">'+esc(person['reading'])+'</span>' if person['reading'] else ''
   content += '<div class="character-card" id="character-'+esc(person['id'])+'"><dt>'+esc(person['name'])+reading+'</dt><dd class="character-role">'+esc(person['role'])+'</dd><dd>'+esc(person['description'])+'</dd></div>'
  content += '</dl></section>'
 return content
source = (ROOT / 'manuscript.md').read_text(encoding='utf-8')
story = {'title':'The Voynich XCrossings', 'edition':'共通部第一〜四部・第6稿', 'version':hashlib.sha256(source.encode()).hexdigest()[:16], 'markdown':source, 'progressVersion':'c1ba2af7557bef9d'}
migrations = json.loads((ROOT / 'reading-migrations.json').read_text())
story.update(progressRevision=migrations['revision'], anchorMigrations=migrations['anchorMigrations'])
def build(story, destination):
 base = './' if destination.parent == ROOT else '../'
 story['assetBase'] = base + 'assets/'
 story['navigation'] = [{'url':base+target+'?draft=6','label':label} for target,label in [('', '共通部 第一〜四部'),('rana/','ラーナルート'),('misha/','ミーシャルート'),('mio/','澪ルート（トゥルー）'),('ritsu/','律の後日譚')]]

 html = (ROOT / 'src/template.html').read_text().replace('/*__EDITION__*/', html_tools.escape(story['edition']))
 for marker, value in {
  '/*__CHARACTERS__*/':characters_html()+'<p class="dialog-note"><a href="'+base+'characters/">人物一覧を別ページで開く</a></p>',
  '/*__CSS__*/':(ROOT/'src/reader.css').read_text(),
  '/*__STORY__*/':json.dumps(story,ensure_ascii=False).replace('<',chr(92)+'u003c'),
  '/*__CORE__*/':(ROOT/'src/reader-core.js').read_text(),
  '/*__APP__*/':(ROOT/'src/app.js').read_text()
 }.items():
  assert html.count(marker)==1, marker
  html = html.replace(marker,value)
 html = html.replace('</body>', '<footer class="figure-credit-link"><a href="'+base+'credits/">図版について</a></footer></body>')
 destination.write_text(html,encoding='utf-8')
 print(json.dumps({'output':str(destination.relative_to(ROOT)),'version':story['version'],'manuscript_characters':len(story['markdown']),'bytes':len(html.encode())},ensure_ascii=False))
story['routes'] = [
 {'url':'./rana/?draft=6', 'label':'ラーナルートを読む', 'description':'共通第四部から、町の設備と地図の調査を進める展開です。'},
 {'url':'./misha/?draft=6', 'label':'ミーシャルートを読む', 'description':'共通第四部から、研究記録の調査を進める別の展開です。'},
 {'url':'./mio/?draft=6','label':'澪ルートを読む','description':'共通第四部から分岐するトゥルールートです。先にラーナ・ミーシャの順で読むことをおすすめします。'}]
build(story, ROOT/'index.html')
for slug, name in [('rana','ラーナ'),('misha','ミーシャ'),('mio','澪'),('ritsu','律')]:
 text = (ROOT/slug/'manuscript.md').read_text()
 route = {'title':story['title'], 'edition':name+'ルート・第6稿（共通第四部から分岐）',
  'markdown':text, 'version':hashlib.sha256(text.encode()).hexdigest()[:16],
  'progressVersion':slug+'-draft4-reader-v1', 'progressRevision':json.loads((ROOT/slug/'reading-migrations.json').read_text())['revision'], 'anchorMigrations':json.loads((ROOT/slug/'reading-migrations.json').read_text())['anchorMigrations'],
  'routes':[{'url':'../?draft=6','label':'共通部へ戻る','description':'共通第四部から分岐する独立したルートです。'}]}
 if slug == 'rana':
  route['routes'].insert(0, {'url':'../misha/?draft=6','label':'ミーシャルートを読む','description':'共通第四部から別の調査を選んだ展開です。ラーナルートの続編ではありません。'})
 if slug == 'misha':
  route['routes'].insert(0, {'url':'../mio/?draft=6','label':'澪ルートを読む','description':'共通第四部から別の行動を選んだトゥルールートです。'})
 if slug == 'mio':
  route['routes'].insert(0, {'url':'../ritsu/?draft=6','label':'律の後日譚を読む','description':'澪エンドの後に続くエピローグです。'})
 if slug == 'ritsu':
  route['edition']='律エピローグ・第6稿（澪エンド後）'
 build(route, ROOT/slug/'index.html')

# 公開用の紹介だけで作る独立ページ。本文・作者用資料は埋め込まない。
character_dir = ROOT/'characters'
character_dir.mkdir(exist_ok=True)
character_page = '<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>人物一覧 | The Voynich XCrossings</title><style>'+(ROOT/'src/reader.css').read_text()+'</style></head><body><header class="masthead"><div class="brand">The Voynich XCrossings</div><a class="character-back" href="../?draft=6">試読ページへ</a></header><main class="character-page"><h1>人物一覧</h1>'+characters_html('h2')+'<footer class="character-footer">試読画面の上部にも「人物一覧」があります。そちらでは、読んでいるページを離れずに確認できます。</footer></main></body></html>\n'
(character_dir/'index.html').write_text(character_page,encoding='utf-8')
print(json.dumps({'output':'characters/index.html','people':sum(len(g['people']) for g in characters['groups'])},ensure_ascii=False))
