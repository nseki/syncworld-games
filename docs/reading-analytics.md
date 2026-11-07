# SyncWorld Stories / GA4 reading analytics

Measurement ID: `G-M7PJD05WLR` (unchanged). Domain and Pages configuration remain unchanged: `games.syncworld.net`.

## GA4 registration

Admin → Data display → Custom definitions → Create custom dimension.
Create the following dimensions, each with scope **Event**. Enter the event parameter exactly as shown.

| Dimension name | Event parameter |
| --- | --- |
| 作品ID | work_id |
| 作品名 | work_title |
| ルートID | route_id |
| 章ID | chapter_id |
| 章タイトル | chapter_title |
| 本文リビジョン | content_revision |
| 読書開始方法 | entry_method |
| 遷移先ルートID | destination_route |

`work_id = the-voynich-xcrossings`; route IDs: `common`, `rana`, `misha`, `mio`, `ritsu`.
Chapter IDs are route-local sequential identifiers, e.g. `mio-01`. Frontmatter is `frontmatter`. Compare revisions separately if chapter ordering changes.

## Events

- `reading_start`: once per document load, with entry_method `start`, `resume`, or `bookmark`.
- `reading_page_view`: reader page changes, excluding settings-only repagination and identical-page rerenders. Revisiting a page counts again.
- `reading_chapter_view`: first display of each chapter per document load. TOC jumps count as views, not proof of reading.
- `reading_route_select`: a route link is clicked, with `destination_route`; not proof that the destination loaded.
- `reading_route_complete`: once per document load when forward navigation reaches the last page. This measures reaching the ending, not full reading or time spent. TOC jumps, bookmarks, resume and settings do not trigger completion.

All events carry work, route, chapter and content revision. Page events also carry numeric `page_number` and `page_count`; these depend on the reader's page length setting and should not be registered as dimensions. No reading-time metric is collected. Events are per document load, not unique users or sessions. Blocked analytics never prevents reading. No new persistent storage is used.

Existing page_view configuration remains unchanged; no synthetic page_view or config call is added. Existing historical data and browser progress keys/migrations are untouched. Registration does not backfill past custom-dimension reports. The new reading events currently cover VXC only; Pelagian Legacy remains unchanged.

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
