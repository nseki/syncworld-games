(() => {
  const contents = document.querySelector('#contents');
  const pages = Array.from(document.querySelectorAll('[data-chapter]'));
  const pagesByHash = new Map(pages.map(page => ['#' + page.id, page]));
  const contentsLinks = Array.from(contents.querySelectorAll('a'));
  const chaptersSeen = new Set();
  let currentPage;
  let completed = false;

  function track(name, page, extra = {}) {
    try {
      window.gtag('event', name, {
        work_id: 'ny-isekai',
        work_title: 'ニューヨークは異世界だった',
        route_id: 'common',
        content_revision: 'v1.4',
        chapter_id: page.dataset.chapter,
        chapter_title: page.dataset.chapterTitle,
        page_number: pages.indexOf(page) + 1,
        page_count: pages.length,
        ...extra,
      });
    } catch {
      // Reading remains available if analytics is blocked.
    }
  }

  function showPage(page, reason, moveFocus = false) {
    if (currentPage === page) return;
    const firstDisplay = !currentPage;
    for (const item of pages) item.hidden = item !== page;
    const activeLink = contentsLinks.findLast(link => link.hash === '#' + page.id);
    for (const link of contentsLinks) {
      if (link === activeLink) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    currentPage = page;
    if (moveFocus) {
      contents.open = false;
      const heading = page.querySelector('h2, h3');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      page.scrollIntoView();
    }

    if (firstDisplay) track('reading_start', page, { entry_method: reason });
    track('reading_page_view', page);
    const chapter = page.dataset.chapter;
    if (chapter !== 'tutorial' && chapter !== 'next-tutorial' && !chaptersSeen.has(chapter)) {
      chaptersSeen.add(chapter);
      track('reading_chapter_view', page);
    }
    if (reason === 'next' && page === pages.at(-1) && !completed) {
      completed = true;
      track('reading_route_complete', page);
    }
  }

  function restoreLocation() {
    if (location.hash === '#contents') {
      contents.open = true;
      return;
    }
    showPage(pagesByHash.get(location.hash) || pages[0], 'bookmark', true);
  }

  document.querySelector('main').addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest('a[href^="#"]');
    if (!link) {
      const page = event.target.closest('[data-chapter]');
      if (page === currentPage &&
          !event.target.closest('footer, a, button, input, select, textarea, summary, [contenteditable]') &&
          !window.getSelection()?.toString().trim()) {
        page.querySelector('[data-next]')?.click();
      }
      return;
    }

    if (link.hash === '#contents') {
      contents.open = true;
      event.preventDefault();
      contents.querySelector('summary').focus();
      contents.scrollIntoView();
      return;
    }
    const page = pagesByHash.get(link.hash);
    if (!page) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    const isNext = link.hasAttribute('data-next') &&
      link.closest('[data-chapter]') === currentPage &&
      pages[pages.indexOf(currentPage) + 1] === page;
    showPage(page, isNext ? 'next' : 'bookmark', true);
  });

  window.addEventListener('hashchange', restoreLocation);
  window.addEventListener('popstate', restoreLocation);

  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    const debug = new URLSearchParams(location.search).get('debug_mode') === '1';
    window.gtag('config', 'G-M7PJD05WLR', debug ? { debug_mode: true } : {});
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=G-M7PJD05WLR';
    document.head.append(tag);
  } catch {
    // Analytics setup is optional for the reader.
  }

  contents.open = location.hash === '#contents';
  const linkedPage = pagesByHash.get(location.hash);
  showPage(linkedPage || pages[0], linkedPage ? 'bookmark' : 'start', Boolean(linkedPage));
})();
