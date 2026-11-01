(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ReaderCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  function parseMarkdown(source) {
    const blocks = [], chapters = [], parts = [];
    let paragraph = [], table = [], comment = false, boundary = true, part = -1, chapter = -1, titleSeen = false;
    function add(text, kind) {
      if (!text) return;
      const item = {id: blocks.length, text, kind: kind || 'text', part, chapter, breakBefore: boundary};
      blocks.push(item);
      if (chapter >= 0 && chapters[chapter].startId === null) chapters[chapter].startId = item.id;
      boundary = false;
    }
    function flush() { if (paragraph.length) { add(paragraph.join('\n')); paragraph = []; } }
    function flushTable() {
      if (!table.length) return;
      flush(); boundary = true; add(table.join('\n'), 'table'); boundary = true; table = [];
    }
    for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
      const line = raw.trim();
      if (comment || line.startsWith('<!--')) {
        flushTable(); flush(); comment = !line.includes('-->'); continue;
      }
      if (line.startsWith('|') && line.endsWith('|')) { flush(); table.push(line); continue; }
      flushTable();
      if (!line) { flush(); continue; }
      if (/^# /.test(line)) {
        flush();
        if (!titleSeen) { titleSeen = true; continue; }
        boundary = true; add(line.slice(2), 'title'); boundary = true; continue;
      }
      if (/^## /.test(line)) {
        flush(); part = parts.length;
        parts.push({index:part, title:line.slice(3), label:line.slice(3).split(/[ 　]/)[0]});
        boundary = true; continue;
      }
      if (/^### /.test(line)) {
        flush(); chapter = chapters.length;
        const title = line.slice(4);
        chapters.push({index:chapter, part, title, label:title.split(/[ 　]/)[0], startId:null});
        boundary = true; continue;
      }
      if (line === '＊' || /^---+$/.test(line)) { flush(); boundary = true; continue; }
      if (/^\*全六部/.test(line) || line === '*タイトル*') { flush(); continue; }
      if (/^\*.*完\*$/.test(line)) { flush(); boundary = true; add(line.slice(1,-1), 'end'); boundary = true; continue; }
      if (/^\*.+ルート・了\*$/.test(line)) { flush(); boundary = true; add(line.slice(1,-1), 'end'); boundary = true; continue; }
      if (/^\*第.+部・了\*$/.test(line)) { flush(); add(line.slice(1,-1), 'note'); continue; }
      paragraph.push(/^\*.*\*$/.test(line) ? line.slice(1,-1) : line);
    }
    flushTable(); flush();
    return {blocks, chapters, parts};
  }
  function paginate(blocks, target) {
    const limit = Number.isFinite(target) ? Math.max(120, Math.min(1200,target)) : 360;
    const pages = []; let current = [], count = 0;
    function flush() {
      if (!current.length) return;
      pages.push({blocks:current, startId:current[0].id, endId:current[current.length-1].id, chapter:current[0].chapter, part:current[0].part});
      current = []; count = 0;
    }
    for (const block of blocks) {
      if (block.breakBefore || block.kind === 'title' || block.kind === 'end' || block.kind === 'table') flush();
      const size = Array.from(block.text).length;
      if (current.length && count + size > limit) flush();
      current.push(block); count += size;
      if (block.kind === 'title' || block.kind === 'end' || block.kind === 'table') flush();
    }
    flush(); return pages;
  }
  function pageForAnchor(pages, rawAnchor) {
    const anchor = Number.isFinite(rawAnchor) ? Math.max(0,Math.floor(rawAnchor)) : 0;
    const i = pages.findIndex(page => page.endId >= anchor);
    return i < 0 ? Math.max(0,pages.length-1) : i;
  }
  function validAnchor(value, length) {
    const n = Number(value);
    return value !== null && value !== '' && Number.isInteger(n) && n >= 0 && n < length ? n : null;
  }
  function migrateAnchor(value, sourceRevision, targetRevision, migrations, length) {
    if (sourceRevision === targetRevision) return validAnchor(value, length);
    const map = migrations && migrations[sourceRevision || 'legacy'];
    if (!Array.isArray(map)) return null;
    const index = validAnchor(value, map.length);
    return index === null ? null : validAnchor(map[index], length);
  }
  return {parseMarkdown, paginate, pageForAnchor, validAnchor, migrateAnchor};
});
