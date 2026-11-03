(function(){
  'use strict';
  const story = JSON.parse(document.getElementById('story-data').textContent);
  const {parseMarkdown,paginate,pageForAnchor,validAnchor,migrateAnchor} = ReaderCore;
  const manuscript = parseMarkdown(story.markdown);
  const $ = id => document.getElementById(id);
  const keys={settings:'yakusoku-reader-settings-v1',progress:'yakusoku-reader-'+(story.progressVersion||story.version)};
  let storageAvailable=true;
  function load(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}}
  function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(_){storageAvailable=false;}}
  const stored=load(keys.settings)||{};
  const mobile=window.matchMedia('(max-width:600px)').matches;
  const allowed=[240,360,480];
  const settings={font:Number.isFinite(stored.font)?Math.max(16,Math.min(28,stored.font)):(mobile?18:21),target:allowed.includes(stored.target)?stored.target:(mobile?240:360),theme:['light','dark'].includes(stored.theme)?stored.theme:(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')};
  const restored=load(keys.progress)||{};
  const anchorFrom=(value,revision)=>migrateAnchor(value,revision,story.progressRevision,story.anchorMigrations,manuscript.blocks.length);
  const hashParams=new URLSearchParams(location.hash.slice(1));
  const hashAnchor=anchorFrom(hashParams.get('at'),hashParams.get('rev'));
  const resumeAnchor=anchorFrom(restored.anchor,restored.revision);
  let pages=paginate(manuscript.blocks,settings.target);
  let pageIndex=pageForAnchor(pages,hashAnchor===null?(resumeAnchor||0):hashAnchor);
  let maxVisited=anchorFrom(restored.maxVisited,restored.revision)||0;
  let toastTimer;
  function toast(message){$('toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('toast').textContent='';},4000);}
  function applySettings(){document.documentElement.dataset.theme=settings.theme;document.documentElement.style.setProperty('--reading-size',settings.font+'px');$('font-value').textContent=settings.font+'px';$('font-minus').disabled=settings.font<=16;$('font-plus').disabled=settings.font>=28;$('page-size').value=String(settings.target);$('theme-toggle').textContent=settings.theme==='dark'?'紙の色にする':'夜の色にする';save(keys.settings,settings);}
  function persist(){const anchor=pages[pageIndex].startId;maxVisited=Math.max(maxVisited,pages[pageIndex].endId);save(keys.progress,{anchor,maxVisited,revision:story.progressRevision});try{history.replaceState(null,'','#at='+anchor+'&rev='+encodeURIComponent(story.progressRevision));}catch(_){}if(!storageAvailable)$('toast').textContent='このブラウザーでは読書位置を保存できません。';}
  function render(){
    const page=pages[pageIndex];if(!page)return;
    const chapter=manuscript.chapters[page.chapter];const part=manuscript.parts[page.part];
    $('part-label').textContent=part?part.title:story.title;
    $('chapter-title').textContent=chapter?chapter.title:'';
    $('chapter-title').hidden=!chapter;
    $('chapter-position').textContent=chapter?'第'+(page.chapter+1)+'章 / 全'+manuscript.chapters.length+'章':'';
    const fragment=document.createDocumentFragment();
    page.blocks.forEach(block=>{
      if(block.kind==='figure'){
        const figure=document.createElement('figure');figure.className='story-figure '+block.text;
        const img=document.createElement('img');
        const figures={
          'garden-cross':'赤地に白い八尖の十字。箱庭の移転申請書の印。',
          f38r:'葉と根を描いた手稿の植物図。葉の下に未知の文字が並ぶ。',
          'hospitaller-cross':'聖ヨハネ騎士団の八尖十字。赤地に白い十字があり、四本の腕の先がV字に割れている。',
          'cross-comparison':'左は移転申請書の均整の取れた十字。右は古い帳面の十字で、四本の腕の先が平らで、切れ込みがない。',
          'maps-overlaid':'旧貯留区画の輪郭に、現在の家々、水路、井戸と作業場が重なる。',
          'boat-sketch':'舟の縁から長い線が伸び、短い線の脇に小さな窪みがある。',
          'waiting-lines':'ミーシャと澪の二本の線は、現在から先が破線。次の時期は未確定。'
        };
        img.src=story.assetBase+(block.text==='f38r'?'f38r-illustration':block.text)+'.svg';
        img.alt=figures[block.text];
        figure.appendChild(img);fragment.appendChild(figure);
      }else if(block.kind==='title' && block.text===story.title){
        const logo=document.createElement('img');
        logo.className='cover-logo';
        logo.src=story.assetBase+'logo-cover.svg';
        logo.alt=block.text;
        logo.width=800;
        logo.height=250;
        fragment.appendChild(logo);
      }else if(block.kind==='table'){
        const wrap=document.createElement('div');wrap.className='table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','比較表。横にスクロールできます');
        const table=document.createElement('table');
        const rows=block.text.split('\n').map(row=>row.slice(1,-1).split('|').map(cell=>cell.trim()));
        const head=document.createElement('thead'),body=document.createElement('tbody');
        rows.forEach((cells,i)=>{if(i===1&&cells.every(cell=>/^:?-+:?$/.test(cell)))return;const row=document.createElement('tr');cells.forEach(cell=>{const el=document.createElement(i===0?'th':'td');if(i===0)el.scope='col';el.textContent=cell;row.appendChild(el);});(i===0?head:body).appendChild(row);});
        table.append(head,body);wrap.appendChild(table);fragment.appendChild(wrap);
      }else{const p=document.createElement('p');p.textContent=block.text;if(block.kind!=='text')p.className=block.kind;fragment.appendChild(p);}
    });
    $('prose').replaceChildren(fragment);
    $('reading-page').classList.toggle('card',page.blocks[0].kind==='title'||page.blocks[0].kind==='end');
    $('page-count').textContent=(pageIndex+1)+' / '+pages.length;
    $('previous').disabled=pageIndex===0;$('next').disabled=pageIndex===pages.length-1;
    $('next').textContent=pageIndex===pages.length-1?'読了':'次のページ →';
    const routes=pageIndex===pages.length-1?(story.routes||[story.nextRoute||story.returnRoute].filter(Boolean)):[];
    const links=$('route-links');links.hidden=!routes.length;
    const routeFragment=document.createDocumentFragment();
    routes.forEach(route=>{const item=document.createElement('div');const description=document.createElement('p');description.textContent=route.description||'';const link=document.createElement('a');link.href=route.url;link.textContent=route.label;item.append(description,link);routeFragment.appendChild(item);});
    links.replaceChildren(routeFragment);
    const progress=$('progress');progress.setAttribute('aria-valuenow',String(pageIndex+1));progress.setAttribute('aria-valuemax',String(pages.length));$('progress-fill').style.width=((pageIndex+1)/pages.length*100)+'%';
    document.title=(chapter?chapter.title+' | ':'')+story.title;
    persist();window.scrollTo(0,0);if(!document.querySelector('dialog[open]'))$('reading-page').focus({preventScroll:true});
  }
  function move(delta){const n=Math.max(0,Math.min(pages.length-1,pageIndex+delta));if(n!==pageIndex){pageIndex=n;render();}}
  function showDialog(id){$(id).showModal();}
  function showContents(){
    const body=$('toc-body');body.replaceChildren();
    const note=document.createElement('p');note.className='dialog-note';note.textContent='未読の章は、内容を伏せて番号だけで表示します。';body.appendChild(note);
    manuscript.parts.forEach(part=>{
      const section=document.createElement('section');section.className='toc-group';
      const heading=document.createElement('h3');heading.textContent=part.label;section.appendChild(heading);
      manuscript.chapters.filter(c=>c.part===part.index).forEach(chapter=>{
        const button=document.createElement('button');button.type='button';button.className='toc-link';button.disabled=chapter.startId===null;
        if(chapter.index===pages[pageIndex].chapter)button.setAttribute('aria-current','true');
        const mark=document.createElement('span');mark.className='toc-mark';mark.textContent=chapter.startId<=maxVisited?'✓':'';mark.setAttribute('aria-hidden','true');
        const label=document.createElement('span');label.textContent=chapter.startId<=maxVisited?chapter.title:'第'+chapter.label+'章';
        button.append(mark,label);button.addEventListener('click',()=>{pageIndex=pageForAnchor(pages,chapter.startId);$('contents').close();render();});section.appendChild(button);
      });body.appendChild(section);
    });showDialog('contents');
  }
  $('previous').addEventListener('click',()=>move(-1));$('next').addEventListener('click',()=>move(1));
  $('routes-open').addEventListener('click',()=>{
    const body=$('routes-body');body.replaceChildren();
    (story.navigation||[]).forEach(route=>{const link=document.createElement('a');link.className='toc-link route-choice';link.href=route.url;link.textContent=route.label;body.appendChild(link);});
    showDialog('routes');
  });
  $('characters-open').addEventListener('click',()=>showDialog('characters'));
  $('contents-open').addEventListener('click',showContents);$('settings-open').addEventListener('click',()=>showDialog('settings'));
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
  document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('close',()=>$('reading-page').focus({preventScroll:true}));dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});});
  $('font-minus').addEventListener('click',()=>{settings.font=Math.max(16,settings.font-1);applySettings();});
  $('font-plus').addEventListener('click',()=>{settings.font=Math.min(28,settings.font+1);applySettings();});
  $('theme-toggle').addEventListener('click',()=>{settings.theme=settings.theme==='dark'?'light':'dark';applySettings();});
  $('page-size').addEventListener('change',()=>{const anchor=pages[pageIndex].startId;settings.target=Number($('page-size').value);pages=paginate(manuscript.blocks,settings.target);pageIndex=pageForAnchor(pages,anchor);applySettings();render();});
  $('reading-page').addEventListener('click',event=>{if(event.target.closest('.table-scroll')||window.getSelection()?.toString())return;move(1);});
  document.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.isComposing||document.querySelector('dialog[open]'))return;
    if(/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)||event.target.isContentEditable)return;
    if(event.target.closest('.table-scroll'))return;
    if(event.target.closest('button')&&(event.key===' '||event.key==='Enter'))return;
    const direction=(event.key===' '?(event.shiftKey?-1:1):({'ArrowRight':1,'PageDown':1,'ArrowLeft':-1,'PageUp':-1,'Backspace':-1})[event.key]);
    if(direction){event.preventDefault();move(direction);}
  });
  window.addEventListener('hashchange',()=>{const params=new URLSearchParams(location.hash.slice(1));const anchor=anchorFrom(params.get('at'),params.get('rev'));if(anchor!==null){pageIndex=pageForAnchor(pages,anchor);render();}});
  applySettings();render();
  if(hashAnchor===null&&resumeAnchor>0)toast('前回の続きから再開しました。');
})();
