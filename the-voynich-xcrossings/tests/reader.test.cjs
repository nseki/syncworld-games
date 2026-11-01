const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../src/reader-core.js');
const root = path.resolve(__dirname,'..');
const source = fs.readFileSync(path.join(root,'manuscript.md'),'utf8');
const book = core.parseMarkdown(source);
const LEGACY_SURVIVING_ANCHORS = [
  [1030,'「前世の記憶が残ることと、関係があるんですか」'],
  [1209,'「私は覚えてた。でも、ほかの人に見せられなかった」'],
  [1657,'「あなた自身にも、今の人生より前の記憶があるのですか」'],
  [1744,'現地へ入れるという返事が来たのは、翌朝だった。'],
  [2367,'ラーナルート・了']
];

test('third draft contains four common parts and the complete Rana route',()=>{
  assert.equal(book.parts.length,5);assert.equal(book.chapters.length,40);
  assert.equal(book.blocks[0].text,'「戻らないで！」');
  assert.equal(book.parts.at(-1).title,'ラーナルート　帰り道のある町');
  assert.equal(book.blocks.at(-1).text,'ラーナルート・了');
  assert.equal(book.blocks.at(-1).kind,'end');
  assert.ok(book.chapters.every(c=>Number.isInteger(c.startId)));
});
test('every prose line is preserved, in order, with no duplicates',()=>{
  const expected=source.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!/^#{1,3} /.test(l)&&l!=='＊'&&!/^---+$/.test(l)&&!/^\*全六部/.test(l)&&l!=='*タイトル*').map(l=>/^\*.*\*$/.test(l)?l.slice(1,-1):l).join('\n');
  const actual=book.blocks.filter(b=>b.kind!=='title').map(b=>b.text).join('\n');
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
  assert.deepEqual(pages.map(p=>p.blocks.map(b=>b.text).join('')),['A','B','Book','C']);
});
test('invalid URL or stored anchors cannot select a nonexistent page',()=>{
  for(const x of [null,'','NaN','-1','1.5','Infinity','<script>',String(book.blocks.length)])assert.equal(core.validAnchor(x,book.blocks.length),null);
  assert.equal(core.validAnchor('0',book.blocks.length),0);
  assert.equal(core.validAnchor('15',book.blocks.length),15);
});
test('standalone HTML includes exact authoritative manuscript and no external dependencies',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const json=html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
  assert.equal(JSON.parse(json).markdown,source);
  assert.equal((html.match(/<script(?:\s|>)/g)||[]).length,3);
  assert.doesNotMatch(html,/<(?:script|link)[^>]*(?:src|href)=["']https?:/);
  assert.doesNotMatch(html,/\/\*__(?:CSS|STORY|CORE|APP)__\*\//);
  for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new (require('node:vm').Script)(script[1]);
});

test('appending parts preserves existing paragraph IDs and reading progress',()=>{
  const prefix=book.blocks.slice(0,889);
  assert.equal(require('node:crypto').createHash('sha256').update(JSON.stringify(prefix)).digest('hex'),'c7f6206056e6fbffcd533cab113a121bc0920035904e86107f2226429340d7e6');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const story=JSON.parse(html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(story.progressVersion,'c1ba2af7557bef9d');
  assert.match(html,/story\.progressVersion\|\|story\.version/);
});

test('the route ending occupies its own page at every supported page length',()=>{
  for(const size of [240,360,480]){
    const pages=core.paginate(book.blocks,size);
    const end=pages.at(-1);
    assert.equal(end.blocks.length,1);
    assert.equal(end.blocks[0].kind,'end');
  }
});

test('legacy reading positions migrate once and remain within the same chapter',()=>{
  const migration=JSON.parse(fs.readFileSync(path.join(root,'reading-migrations.json'),'utf8'));
  const map=migration.anchorMigrations.legacy;
  assert.equal(map.length,2368);
  assert.deepEqual(map.slice(0,889),Array.from({length:889},(_,i)=>i));
  assert.ok(map.every((n,i)=>Number.isInteger(n)&&n>=0&&n<book.blocks.length&&(i===0||n>=map[i-1])));
  const starts=[0,100,149,211,270,328,363,421,497,561,622,715,788,842,889,953,1009,1074,1123,1177,1259,1291,1352,1440,1525,1584,1630,1682,1744,1774,1810,1863,1903,1948,2008,2074,2118,2179,2237,2285];
  starts.forEach((start,chapter)=>{
    for(let i=start;i<(starts[chapter+1]??map.length);i++)assert.equal(book.blocks[map[i]].chapter,chapter);
  });
  for(const [oldAnchor,text] of LEGACY_SURVIVING_ANCHORS){
    const current=core.migrateAnchor(oldAnchor,null,migration.revision,migration.anchorMigrations,book.blocks.length);
    assert.equal(book.blocks[current].text,text);
    assert.equal(core.migrateAnchor(current,migration.revision,migration.revision,migration.anchorMigrations,book.blocks.length),current);
  }
  for(const value of [null,'',-1,'NaN',2368])assert.equal(core.migrateAnchor(value,null,migration.revision,migration.anchorMigrations,book.blocks.length),null);
  assert.equal(core.migrateAnchor(100,'unknown',migration.revision,migration.anchorMigrations,book.blocks.length),null);
  assert.equal(map.at(-1),book.blocks.length-1);
});

test('Misha is an independent route with six intact tables and all narrative preserved',()=>{
  const manuscript=fs.readFileSync(path.join(root,'misha/manuscript.md'),'utf8');
  const route=core.parseMarkdown(manuscript);
  assert.equal(route.parts.length,1);assert.equal(route.chapters.length,12);
  const tables=route.blocks.filter(b=>b.kind==='table');assert.equal(tables.length,6);
  const expected=manuscript.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!/^#{1,3} /.test(l)&&l!=='＊'&&!/^---+$/.test(l)).map(l=>/^\*.*\*$/.test(l)?l.slice(1,-1):l).join('\n');
  assert.equal(route.blocks.map(b=>b.text).join('\n'),expected);
  assert.match(manuscript,/十一歳のころ/);assert.match(manuscript,/一六五〇年/);assert.match(manuscript,/一八三九年/);
  for(const size of [240,360,480]){
    const pages=core.paginate(route.blocks,size);
    assert.deepEqual(pages.flatMap(p=>p.blocks.map(b=>b.id)),route.blocks.map(b=>b.id));
    assert.equal(pages.filter(p=>p.blocks.some(b=>b.kind==='table')).length,6);
    assert.ok(pages.filter(p=>p.blocks.some(b=>b.kind==='table')).every(p=>p.blocks.length===1));
  }
  const html=fs.readFileSync(path.join(root,'misha/index.html'),'utf8');
  const data=JSON.parse(html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.markdown,manuscript);assert.notEqual(data.progressVersion,'c1ba2af7557bef9d');
  assert.equal(data.returnRoute.url,'../');
  assert.doesNotMatch(data.markdown,/執筆資料|<!--/);
  for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new (require('node:vm').Script)(script[1]);
});

test('editorial comments are hidden and do not become table cells or prose',()=>{
  const x=core.parseMarkdown('# Book\n\n## Route\n\n### One\n\nBefore\n\n<!-- private\neditorial text -->\n\n| A | B |\n| --- | --- |\n| <script> | safe |\n\nAfter');
  assert.deepEqual(x.blocks.map(b=>b.kind),['text','table','text']);
  assert.equal(x.blocks[0].text,'Before');assert.equal(x.blocks[2].text,'After');
  assert.doesNotMatch(x.blocks.map(b=>b.text).join(''),/private|editorial/);
});
