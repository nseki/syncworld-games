const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../src/reader-core.js');
const root = path.resolve(__dirname,'..');
const source = fs.readFileSync(path.join(root,'manuscript.md'),'utf8');
const book = core.parseMarkdown(source);

test('third draft contains the first four parts and 28 chapters',()=>{
  assert.equal(book.parts.length,4);assert.equal(book.chapters.length,28);
  assert.equal(book.blocks[0].text,'「戻らないで！」');
  assert.match(book.blocks.at(-1).text,/第四部・了/);
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
