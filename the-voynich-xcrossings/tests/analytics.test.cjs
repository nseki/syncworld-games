const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {create}=require('../src/analytics.js');
const story={workId:'the-voynich-xcrossings',title:'The Voynich XCrossings',routeId:'mio',progressRevision:'mio-draft6-v1'};
function setup(){const events=[];return {events,tracker:create(story,(name,params)=>events.push({name,params}))};}
const chapter={index:0,title:'一'};
const page={startId:0,endId:4};
test('resume sends additive events with work, route, chapter and revision; rerender is deduplicated',()=>{
 const {events,tracker}=setup();tracker.view(page,chapter,0,3,'resume');tracker.view(page,chapter,0,3,'navigation');
 assert.deepEqual(events.map(e=>e.name),['reading_start','reading_page_view','reading_chapter_view']);
 assert.equal(events[0].params.entry_method,'resume');
 for(const {params} of events){assert.equal(params.work_id,story.workId);assert.equal(params.route_id,'mio');assert.equal(params.chapter_id,'mio-01');assert.equal(params.content_revision,story.progressRevision);}
 tracker.view({startId:5,endId:9},chapter,1,3,'next');
 tracker.view(page,chapter,0,3,'previous');
 assert.equal(events.filter(e=>e.name==='reading_chapter_view').length,1);
 assert.equal(events.filter(e=>e.name==='reading_page_view').length,3);
});
test('bookmark, TOC and settings cannot cause route completion; next counts once',()=>{
 const {events,tracker}=setup();
 for(const reason of ['bookmark','navigation','settings'])tracker.view(page,chapter,2,3,reason);
 assert.ok(!events.some(e=>e.name==='reading_route_complete'));
 tracker.view(page,chapter,2,3,'next');tracker.view(page,chapter,2,3,'next');
 assert.equal(events.filter(e=>e.name==='reading_route_complete').length,1);
});
test('repagination suppresses page events and route choices contain fixed identifiers only',()=>{
 const {events,tracker}=setup();tracker.view(page,chapter,0,3,'start');
 tracker.view({startId:0,endId:9},chapter,0,2,'settings');
 assert.equal(events.filter(e=>e.name==='reading_page_view').length,1);
 tracker.selectRoute('../rana/?draft=6');tracker.selectRoute('../?draft=6');
 assert.deepEqual(events.slice(-2).map(e=>e.params.destination_route),['rana','common']);
 assert.doesNotMatch(JSON.stringify(events),/draft=|https:|#at/);
});
test('blocked analytics is harmless and frontmatter has an explicit identifier',()=>{
 const {events,tracker}=setup();tracker.view(page,undefined,0,3,'start');
 assert.equal(events[0].params.chapter_id,'frontmatter');
 assert.doesNotThrow(()=>create(story,()=>{throw Error('blocked');}).view(page,chapter,0,3,'start'));
});
test('every generated reader embeds shared tracking before app and retains the existing single GA4 config',()=>{
 for(const slug of ['', 'rana','misha','mio','ritsu']){
  const html=fs.readFileSync(path.join(__dirname,'..',slug,'index.html'),'utf8');
  const data=JSON.parse(html.match(/<script id="story-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.workId,story.workId);assert.equal(data.routeId,slug||'common');
  assert.equal((html.match(/gtag\('config', 'G-M7PJD05WLR'\)/g)||[]).length,1);
  assert.ok(html.indexOf('root.ReadingAnalytics=api')<html.indexOf('const tracking='));
 }
});
