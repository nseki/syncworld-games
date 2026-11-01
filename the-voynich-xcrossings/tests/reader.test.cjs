const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../src/reader-core.js');
const root = path.resolve(__dirname,'..');
const source = fs.readFileSync(path.join(root,'manuscript.md'),'utf8');
const book = core.parseMarkdown(source);
test('fourth draft publishes exactly four common parts and 28 chapters',()=>{
  assert.equal(book.parts.length,4);assert.equal(book.chapters.length,28);
  assert.equal(book.blocks[0].text,'「戻らないで！」');
  assert.equal(book.parts.at(-1).title,'第四部　助けた理由');
  assert.equal(book.blocks.at(-1).text,'共通部・第4稿　試読ここまで');
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

test('fourth draft keeps the existing progress storage and does not offer a route link',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const story=JSON.parse(html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(story.progressVersion,'c1ba2af7557bef9d');
  assert.equal(story.progressRevision,'draft4-v1');
  assert.equal(story.edition,'共通部第一〜四部・第4稿');
  assert.equal(story.nextRoute,undefined);assert.equal(story.returnRoute,undefined);
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

test('old route URL contains a holding page and no old story or embedded manuscript',()=>{
  const html=fs.readFileSync(path.join(root,'misha/index.html'),'utf8');
  assert.match(html,/試読範囲を更新しました/);
  assert.match(html,/href="\.\.\/\?draft=4"/);
  assert.doesNotMatch(html,/story-data|帰還せず|第3稿/);
  assert.equal(fs.existsSync(path.join(root,'misha/manuscript.md')),false);
});

test('editorial comments are hidden and do not become table cells or prose',()=>{
  const x=core.parseMarkdown('# Book\n\n## Route\n\n### One\n\nBefore\n\n<!-- private\neditorial text -->\n\n| A | B |\n| --- | --- |\n| <script> | safe |\n\nAfter');
  assert.deepEqual(x.blocks.map(b=>b.kind),['text','table','text']);
  assert.equal(x.blocks[0].text,'Before');assert.equal(x.blocks[2].text,'After');
  assert.doesNotMatch(x.blocks.map(b=>b.text).join(''),/private|editorial/);
});
