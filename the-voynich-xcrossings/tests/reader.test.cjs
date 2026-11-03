const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../src/reader-core.js');
const root = path.resolve(__dirname,'..');
const source = fs.readFileSync(path.join(root,'manuscript.md'),'utf8');
const book = core.parseMarkdown(source);
test('sixth draft publishes exactly four common parts and 28 chapters',()=>{
  assert.equal(book.parts.length,4);assert.equal(book.chapters.length,28);
  assert.equal(book.blocks[0].text,'「戻らないで！」');
  assert.equal(book.parts.at(-1).title,'第四部　助けた理由');
  assert.equal(book.blocks.at(-1).text,'共通部・第6稿　試読ここまで');
  assert.equal(book.blocks.at(-1).kind,'end');
  assert.ok(book.chapters.every(c=>Number.isInteger(c.startId)));
});
test('every prose line is preserved, in order, with no duplicates',()=>{
  const expected=source.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('<!-- figure:')&&!/^#{1,3} /.test(l)&&l!=='＊'&&!/^---+$/.test(l)&&!/^\*全六部/.test(l)&&l!=='*タイトル*').map(l=>/^\*.*\*$/.test(l)?l.slice(1,-1):l).join('\n');
  const actual=book.blocks.filter(b=>b.kind!=='title'&&b.kind!=='figure').map(b=>b.text).join('\n');
  assert.equal(actual,expected);
});
test('page length options retain every block exactly once',()=>{
  for(const size of [120,240,360,480,1200]){
    const pages=core.paginate(book.blocks,size);
    assert.deepEqual(pages.flatMap(p=>p.blocks.map(b=>b.id)),book.blocks.map(b=>b.id));
    assert.ok(pages.every(p=>p.blocks.length&&p.blocks.every(b=>b.chapter===p.chapter)));
    assert.ok(pages.every(p=>p.blocks[0].kind!=='title'||p.blocks.length===1));
  }
});
test('reading anchor stays visible after changing page size',()=>{
  for(let anchor=0;anchor<book.blocks.length;anchor+=19){
    for(const size of [240,360,480]){
      const pages=core.paginate(book.blocks,size);
      const p=pages[core.pageForAnchor(pages,anchor)];
      assert.ok(p.startId<=anchor&&p.endId>=anchor);
    }
  }
});
test('scene breaks and title cards do not join unrelated scenes',()=>{
  const b=core.parseMarkdown('# Book\n\n## 第一部\n\n### 一 Scene\n\nA\n\n＊\n\nB\n\n# Book\n\n*タイトル*\n\n## 第二部\n\n### 一 Next\n\nC');
  const pages=core.paginate(b.blocks,480);
  assert.deepEqual(pages.map(p=>p.blocks.filter(b=>b.kind!=='figure').map(b=>b.text).join('')),['A','B','Book','C']);
});
test('invalid URL or stored anchors cannot select a nonexistent page',()=>{
  for(const x of [null,'','NaN','-1','1.5','Infinity','<script>',String(book.blocks.length)])assert.equal(core.validAnchor(x,book.blocks.length),null);
  assert.equal(core.validAnchor('0',book.blocks.length),0);
  assert.equal(core.validAnchor('15',book.blocks.length),15);
});
test('standalone HTML includes exact authoritative manuscript and only the GA4 external script',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const json=html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.equal(JSON.parse(json).markdown,source);
  assert.equal((html.match(/<script(?:\s|>)/g)||[]).length,5);
  const external = [...html.matchAll(/<(?:script|link)[^>]*(?:src|href)=["'](https?:[^"']+)["']/g)].map(match=>match[1]);
  assert.deepEqual(external,['https://www.googletagmanager.com/gtag/js?id=G-7GGTTZLCQE']);
  assert.doesNotMatch(html,/\/\*__(?:CSS|STORY|CORE|APP)__\*\//);
  for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new (require('node:vm').Script)(script[1]);
});

test('sixth draft preserves common progress and offers three independent routes',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const story=JSON.parse(html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(story.progressVersion,'c1ba2af7557bef9d');
  assert.equal(story.progressRevision,'draft6-v5');
  assert.equal(story.edition,'共通部第一〜四部・第6稿');
  assert.deepEqual(story.routes.map(r=>r.url),['./rana/?draft=6','./misha/?draft=6','./mio/?draft=6']);
  assert.match(html,/story\.progressVersion\|\|story\.version/);
});

test('the preview ending occupies its own page at every supported page length',()=>{
  for(const size of [240,360,480]){
    const pages=core.paginate(book.blocks,size);
    const end=pages.at(-1);
    assert.equal(end.blocks.length,1);
    assert.equal(end.blocks[0].kind,'end');
  }
});

test('both third-draft revisions migrate monotonically within the same common chapter',()=>{
  const migration=JSON.parse(fs.readFileSync(path.join(root,'reading-migrations.json'),'utf8'));
  assert.equal(migration.anchorMigrations.legacy.length,2368);
  assert.equal(migration.anchorMigrations['tightened-v1'].length,2237);
  for(const revision of ['legacy','tightened-v1']){
    const map=migration.anchorMigrations[revision],starts=migration.sourceChapterStarts[revision];
    assert.ok(map.every((n,i)=>Number.isInteger(n)&&n>=0&&n<book.blocks.length&&(i===0||n>=map[i-1])));
    starts.forEach((start,chapter)=>{
      for(let i=start;i<(starts[chapter+1]??map.length);i++){
        if(chapter<28)assert.equal(book.blocks[map[i]].chapter,chapter);
        else assert.equal(map[i],book.blocks.length-1);
        const target=core.migrateAnchor(i,revision,migration.revision,migration.anchorMigrations,book.blocks.length);
        assert.equal(target,map[i]);
        assert.equal(core.migrateAnchor(target,migration.revision,migration.revision,migration.anchorMigrations,book.blocks.length),target);
      }
    });
  }
  assert.equal(core.migrateAnchor(100,'unknown',migration.revision,migration.anchorMigrations,book.blocks.length),null);
});

test('all sixth-draft routes publish complete independent manuscripts with isolated progress',()=>{
  const keys=new Set(['c1ba2af7557bef9d']);
  for(const [slug,tableCount,chapters] of [['rana',0,12],['misha',6,12],['mio',2,14],['ritsu',0,5]]){
    const manuscript=fs.readFileSync(path.join(root,slug,'manuscript.md'),'utf8');
    const route=core.parseMarkdown(manuscript);
    assert.equal(route.parts.length,1);assert.equal(route.chapters.length,chapters);
    assert.equal(route.blocks.filter(b=>b.kind==='table').length,tableCount);
    const expected=manuscript.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('<!-- figure:')&&!/^#{1,3} /.test(l)&&l!=='＊'&&!/^---+$/.test(l)).map(l=>/^\*.*\*$/.test(l)?l.slice(1,-1):l).join('\n');
    assert.equal(route.blocks.filter(b=>b.kind!=='figure').map(b=>b.text).join('\n'),expected);
    const html=fs.readFileSync(path.join(root,slug,'index.html'),'utf8');
    const data=JSON.parse(html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(data.markdown,manuscript);assert.match(data.edition,/第6稿/);
    assert.ok(!keys.has(data.progressVersion));keys.add(data.progressVersion);
    assert.ok(data.routes.some(r=>r.url==='../?draft=6'));
    for(const size of [240,360,480]){
      const pages=core.paginate(route.blocks,size);
      assert.deepEqual(pages.flatMap(p=>p.blocks.map(b=>b.id)),route.blocks.map(b=>b.id));
      assert.equal(pages.at(-1).blocks.length,1);
      assert.ok(pages.filter(p=>p.blocks.some(b=>b.kind==='table')).every(p=>p.blocks.length===1));
    }
    for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new (require('node:vm').Script)(script[1]);
  }
});

test('editorial comments are hidden and do not become table cells or prose',()=>{
  const x=core.parseMarkdown('# Book\n\n## Route\n\n### One\n\nBefore\n\n<!-- private\neditorial text -->\n\n| A | B |\n| --- | --- |\n| <script> | safe |\n\nAfter');
  assert.deepEqual(x.blocks.map(b=>b.kind),['text','table','text']);
  assert.equal(x.blocks[0].text,'Before');assert.equal(x.blocks[2].text,'After');
  assert.doesNotMatch(x.blocks.filter(b=>b.kind!=='figure').map(b=>b.text).join(''),/private|editorial/);
});

test('route navigation is available before reading to the end on every page',()=>{
 for(const slug of ['', 'rana','misha','mio','ritsu']){
  const html=fs.readFileSync(path.join(root,slug,'index.html'),'utf8');
  const story=JSON.parse(html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.doesNotMatch(html,/id="routes-open"/);assert.match(html,/id="toc-body"/);
  assert.equal(story.navigation.length,4);
  for(const route of story.navigation){
   const target=path.resolve(root,slug,route.url.split('?')[0],'index.html');
   assert.ok(fs.existsSync(target),route.url);
  }
 }
});

test('draft-four bookmarks migrate within their chapter in common and every route',()=>{
 for(const slug of ['', 'rana','misha','mio','ritsu']){
  const manuscript=core.parseMarkdown(fs.readFileSync(path.join(root,slug,'manuscript.md'),'utf8'));
  const migration=JSON.parse(fs.readFileSync(path.join(root,slug,'reading-migrations.json'),'utf8'));
  const revision=slug?slug+'-draft4-v1':'draft4-v1';
  const map=migration.anchorMigrations[revision];
  const starts=migration.sourceChapterStarts[revision];
  assert.ok(map.length>0);
  assert.ok(map.every((dest,i)=>Number.isInteger(dest)&&dest>=0&&dest<manuscript.blocks.length&&(i===0||dest>=map[i-1])));
  starts.forEach((start,ch)=>{
   assert.equal(map[start],manuscript.chapters[ch].startId);
   for(let anchor=start;anchor<(starts[ch+1]??map.length);anchor++){
    const dest=core.migrateAnchor(anchor,revision,migration.revision,migration.anchorMigrations,manuscript.blocks.length);
    assert.equal(manuscript.blocks[dest].chapter,ch);
   }
  });
  const html=fs.readFileSync(path.join(root,slug,'index.html'),'utf8');
  const data=JSON.parse(html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.progressRevision,migration.revision);
  assert.deepEqual(data.anchorMigrations,migration.anchorMigrations);
 }
});

test('public character guide contains ten introductory profiles and no late revelations',()=>{
 const cast=JSON.parse(fs.readFileSync(path.join(root,'characters.json'),'utf8'));
 const people=cast.groups.flatMap(g=>g.people);
 assert.equal(people.length,10);
 assert.equal(new Set(people.map(p=>p.id)).size,10);
 assert.match(JSON.stringify(cast),/ミハイロ/);
 assert.doesNotMatch(JSON.stringify(cast),/コーエン|サーラ|シャンポリオン|前世|転生|襲撃|トゥルー|地下文明/);
 const dedicated=fs.readFileSync(path.join(root,'characters/index.html'),'utf8');
 assert.doesNotMatch(dedicated,/story-data|コーエン|サーラ|シャンポリオン|前世|転生|襲撃|地下文明/);
 for(const slug of ['', 'rana','misha','mio','ritsu']){
  const html=fs.readFileSync(path.join(root,slug,'index.html'),'utf8');
  assert.match(html,/id="characters-open"[^>]*>人物一覧</);
  const dialog=html.match(/<dialog id="characters"[\s\S]*?<\/dialog>/)[0];
  assert.doesNotMatch(dialog,/コーエン|サーラ|シャンポリオン|前世|転生|襲撃|地下文明/);
  for(const person of people)assert.ok(dialog.includes('id="character-'+person.id+'"'));
  const href=dialog.match(/href="([^"]+)"/)[1];
  assert.ok(fs.existsSync(path.resolve(root,slug,href,'index.html')));
 }
});

test('opening and closing character guide retains the reading position and stored progress',()=>{
 const vm=require('node:vm');
 for(const slug of ['', 'rana','misha','mio','ritsu']){
  const html=fs.readFileSync(path.join(root,slug,'index.html'),'utf8');
  const story=JSON.parse(html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  class Element{
   constructor(){this.listeners={};this.children=[];this.classList={toggle(){}};this.dataset={};this.style={};this.open=false;}
   addEventListener(kind,fn){(this.listeners[kind]??=[]).push(fn);}
   appendChild(x){this.children.push(x);return x;}
   append(...xs){this.children.push(...xs);}
   replaceChildren(...xs){this.children=xs;}
   setAttribute(){} focus(){} closest(){return null;}
   showModal(){this.open=true;}
   close(){this.open=false;for(const fn of this.listeners.close||[])fn();}
   click(){for(const fn of this.listeners.click||[])fn({target:this});}
  }
  const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  el('story-data').textContent=JSON.stringify(story);
  const dialogNames=['characters','contents','routes','settings'];
  const closes=dialogNames.map(id=>{const x=new Element();x.dataset.close=id;return x;});
  const saved={anchor:100,maxVisited:150,revision:story.progressRevision};
  const key='yakusoku-reader-'+story.progressVersion;
  const storage=new Map([[key,JSON.stringify(saved)]]);
  const location={hash:''};
  const document={getElementById:el,createElement:()=>new Element(),createDocumentFragment:()=>new Element(),documentElement:{dataset:{},style:{setProperty(){}}},querySelectorAll:selector=>selector==='[data-close]'?closes:selector==='dialog'?dialogNames.map(el):[],querySelector:()=>dialogNames.some(id=>el(id).open)?el('characters'):null,addEventListener(){}};
  const window={matchMedia:()=>({matches:false}),scrollTo(){},addEventListener(){},getSelection:()=>null};
  const context={document,window,location,history:{replaceState(_a,_b,hash){location.hash=hash;}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},ReaderCore:core,URLSearchParams,console,setTimeout:()=>0,clearTimeout(){}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'src/app.js'),'utf8'),context);
  const before=storage.get(key),hash=location.hash;
  el('characters-open').click();assert.equal(el('characters').open,true);
  assert.equal(storage.get(key),before);assert.equal(location.hash,hash);
  closes[0].click();assert.equal(el('characters').open,false);
  assert.equal(storage.get(key),before);assert.equal(location.hash,hash);
 }
});
