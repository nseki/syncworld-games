/* Reading events are additive; existing GA4 page_view and reading storage are untouched. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ReadingAnalytics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function create(story,send){
    const base={work_id:story.workId,work_title:story.title,route_id:story.routeId,content_revision:story.progressRevision};
    const chapters=new Set();let started=false,completed=false,lastPage=null,current={};
    // Analytics must never interrupt rendering, including when blocked by the browser.
    function emit(name,extra){try{send(name,Object.assign({},base,current,extra));}catch(_){} }
    return {
      view(page,chapter,index,total,reason){
        current={chapter_id:chapter?story.routeId+'-'+String(chapter.index+1).padStart(2,'0'):'frontmatter',chapter_title:chapter?chapter.title:'扉・前付',page_number:index+1,page_count:total};
        if(!started){started=true;emit('reading_start',{entry_method:reason});}
        const identity=page.startId+':'+page.endId;
        if(lastPage!==identity&&reason!=='settings')emit('reading_page_view');
        lastPage=identity;
        if(chapter&&!chapters.has(chapter.index)){
          chapters.add(chapter.index);emit('reading_chapter_view');
        }
        if(index===total-1&&reason==='next'&&!completed){completed=true;emit('reading_route_complete');}
      },
      selectRoute(url){
        const match=/(?:^|\/)(rana|misha|mio|ritsu)\//.exec(url);
        emit('reading_route_select',{destination_route:match?match[1]:'common'});
      }
    };
  }
  return {create};
});
