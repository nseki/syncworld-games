# SyncWorld Stories / GA4 reading analytics

Measurement ID: `G-M7PJD05WLR` (unchanged). Domain and Pages configuration remain unchanged: `games.syncworld.net`.

## GA4 registration

Admin → Data display → Custom definitions → Create custom dimension.
Create the following dimensions, each with scope **Event**. Enter the event parameter exactly as shown.

| Dimension name | Event parameter |
| --- | --- |
| Work ID | work_id |
| Work Title | work_title |
| Route ID | route_id |
| Chapter ID | chapter_id |
| Chapter Title | chapter_title |
| Content Revision | content_revision |
| Reading Entry Method | entry_method |
| Destination Route ID | destination_route |

`work_id = the-voynich-xcrossings`; route IDs: `common`, `rana`, `misha`, `mio`, `ritsu`.
Chapter IDs are route-local sequential identifiers, e.g. `mio-01`. Frontmatter is `frontmatter`. Compare revisions separately if chapter ordering changes.

## Events

- `reading_start`: once per document load, with entry_method `start`, `resume`, or `bookmark`.
- `reading_page_view`: reader page changes, excluding settings-only repagination and identical-page rerenders. Revisiting a page counts again.
- `reading_chapter_view`: first display of each chapter per document load. TOC jumps count as views, not proof of reading.
- `reading_route_select`: a route link is clicked, with `destination_route`; not proof that the destination loaded.
- `reading_route_complete`: once per document load when forward navigation reaches the last page. This measures reaching the ending, not full reading or time spent. TOC jumps, bookmarks, resume and settings do not trigger completion.

All events carry work, route, chapter and content revision. Page events also carry numeric `page_number` and `page_count`; these depend on the reader's page length setting and should not be registered as dimensions. No reading-time metric is collected. Events are per document load, not unique users or sessions. Blocked analytics never prevents reading. No new persistent storage is used.

Existing page_view configuration remains unchanged; no synthetic page_view or config call is added. Existing historical data and browser progress keys/migrations are untouched. Registration does not backfill past custom-dimension reports. The VXC configuration is unchanged. Pelagian Legacy now loads the same measurement ID once and sends the compatible reading events described below.

## Build and verification

From repository root:

```sh
python3 the-voynich-xcrossings/build.py
node --test the-voynich-xcrossings/tests/*.cjs
```

`src/analytics.js` is embedded before `src/app.js` in the same existing inline script in all five generated readers. Commit source and generated HTML together. No build dependency or Pages setting change is required.

After publication, verify the events in GA4 Realtime / DebugView (enable debug mode with a debugging tool such as Tag Assistant). Test common and each route, resume, TOC, page length changes and route selection. Real ingestion cannot be established by the local unit tests. Custom dimensions can take 24–48 hours to become reportable.

References:
- https://support.google.com/analytics/answer/14239696
- https://developers.google.com/analytics/devguides/collection/ga4/event-parameters

## Pelagian Legacy

The hand-authored `pelagian-legacy/index.html` uses `work_id` and `story_id` = `pelagian-legacy`, `work_title` = `ペラギアンの遺産`, `route_id` = `common`, and `content_revision` = `2.1`.
It has 24 fixed scene pages across a prologue (day 0) and nine days. Chapter IDs follow VXC's sequential convention: `common-01` is the prologue, `common-02` is day 1, and `common-10` is day 9.

Events: `reading_start`, `reading_page_view`, `reading_chapter_view`, `reading_route_complete`. There are no route choices, so no route-select event is emitted. Shared chapter/page parameters match VXC. Additional parameters are `scene_id`, numeric `day_number`, and numeric `progress_percent` (displayed scene position / 24, rounded). Progress describes position, including TOC jumps; it does not prove every preceding scene was read.

The cover sends only GA4's normal page_view. Reading starts on the first displayed scene with entry_method `start` for reader links, or `bookmark` for direct hashes/history. Start, chapter views and completion are deduplicated per document load, matching VXC; revisiting a different scene sends another page view. Reloading begins a new document. Completion requires next-link or prose-tap navigation into the final scene; direct links, TOC and browser history do not count. All existing reader URLs and navigation remain intact.

For DebugView open https://games.syncworld.net/pelagian-legacy/?debug_mode=1 and then start reading. The query parameter enables debug_mode only for this page load; remove it for normal use. In GA4 Admin → Data display → DebugView select your device, inspect the four events and their work/chapter/page parameters. Test next, previous, TOC, prose taps, browser history, and a direct final-scene URL. Real GA4 receipt still requires this account-side verification.
