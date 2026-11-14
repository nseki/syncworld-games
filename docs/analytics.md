# GA4読書イベント仕様・運用

測定IDは **G-M7PJD05WLR**。

## 実装の所在と対象

- VXC: [analytics.js](../the-voynich-xcrossings/src/analytics.js) が状態と送信パラメータを管理し、[app.js](../the-voynich-xcrossings/src/app.js) が表示・移動・ルートリンク操作から呼び出します。[build.py](../the-voynich-xcrossings/build.py) が共通部と4ルートのHTMLへ埋め込み、[template.html](../the-voynich-xcrossings/src/template.html) がGoogleタグを1回設定します。
- ペラギアン: [index.html](../pelagian-legacy/index.html) のGoogleタグ、`readingAnalytics`、`showScene`、リンク監視・本文タップ・`hashchange` が実装です。別ビルドはありません。
- ニューヨーク: 第1巻の [reader.js](../ny-isekai/vol-1/reader.js) と第2巻の [reader.js](../ny-isekai/vol-2/reader.js) が、それぞれ見出し単位の改ページとGA4への送信を担当します。
- [作品一覧](../index.html) にはGoogleタグ設定がありますが読書イベントはありません。VXCの人物一覧・図版クレジットにも独自読書イベントはありません。
- `gtag('event', name, params)` による追加イベントです。章・場面表示のたびに独自の `page_view` は送りません。通常の `page_view` やGA4拡張計測の挙動・設定は、これらの読書イベントとは別です。

## イベントと発火条件

| 実装済みイベント | VXC | ペラギアン |
| --- | --- | --- |
| `reading_start` | 最初のリーダー描画で1回。`entry_method` は有効なハッシュ位置なら `bookmark`、保存位置が0より大きければ `resume`、それ以外は `start` | 最初の有効な場面表示で1回。初期URL・履歴移動なら `bookmark`、読書開始リンク・目次等のクリックなら `start`。表紙では発火しない |
| `reading_page_view` | 表示ページの `startId:endId` が直前と異なり、理由が `settings` でないとき。初回も対象 | 直前の場面IDと異なる有効場面を表示したとき。初回、目次、直リンク、履歴も対象 |
| `reading_chapter_view` | その章を初めて描画したとき。前付には送らない | その日（序章を含む）を初めて表示したとき |
| `reading_route_select` | 目次内のルートリンク、または末尾のルートリンクのクリック。遷移先が読み込まれた証明ではない | 未実装（分岐なし） |
| `reading_route_complete` | `move` による前進（`next`）で最後のページへ到達したとき、1回 | 次へリンクまたは本文タップ（`next`）で最終場面 `day-9-2` へ到達したとき、1回 |

**未実装のイベント名:** `chapter_view`、`chapter_navigation`、`reading_progress`、`chapter_complete`、`story_complete`。これらの名前で送信すると仮定してレポートを作らないでください。`reading_chapter_view` は章への到達であり章の読了ではありません。`progress_percent` はペラギアンのパラメータで、独立した進捗イベントではありません。

## ニューヨークは異世界だった

- `reading_start` は最初のページ表示時に1回送信します。見出しへの直リンクは `entry_method: bookmark`、通常の入口は `start` です。
- `reading_page_view` は初回と表示ページが変わったときに送信します。前後移動、本文タップ、目次、ブラウザーの履歴を含みます。目次を開くだけでは送信しません。
- `reading_chapter_view` は第1〜7話と巻末おまけの各初回表示で送信します。話の中で改ページしても章IDは共通です。
- `reading_route_complete` は「次へ」または本文タップで最終ページ「次のチュートリアル」に到達したときに1回送信します。直リンク、目次、履歴での到達では送信しません。分岐がないため `reading_route_select` は送信しません。
- 共通パラメータは `work_title: ニューヨークは異世界だった`、`route_id: common`、`chapter_id`（`tutorial`、`chapter-1`〜`chapter-7`、`bonus`、`next-tutorial`）、`chapter_title`、`page_number`、`page_count` です。第1巻は `work_id: ny-isekai`、`content_revision: v1.4a`、第2巻は `work_id: ny-isekai-vol-2`、`content_revision: v0.6`、`page_count: 43` を送信します。
- DebugViewでは [第1巻](https://games.syncworld.net/ny-isekai/vol-1/?debug_mode=1) または [第2巻](https://games.syncworld.net/ny-isekai/vol-2/?debug_mode=1) を開き、話内の前後移動、目次、履歴、末尾への前進と直リンクを確認します。

## VXC・ペラギアンのパラメータ

両作品の表示系イベントには以下を付けます。VXCのルート選択は最後に表示したページの章・ページ情報を引き継ぎ、`destination_route` を追加します。

| パラメータ | VXC | ペラギアン |
| --- | --- | --- |
| `work_id` | `the-voynich-xcrossings` | `pelagian-legacy` |
| `work_title` | `The Voynich XCrossings` | `ペラギアンの遺産` |
| `story_id` | **送信しない** | `pelagian-legacy` |
| `route_id` | `common`, `rana`, `misha`, `mio`, `ritsu` | `common` |
| `content_revision` | 各 `reading-migrations.json` の `revision`（`story.progressRevision`） | 固定文字列 `2.1` |
| `chapter_id` | ルートID＋章の順番（1始まり2桁）、例 `mio-01`。章がなければ `frontmatter` | `common-`＋（`data-day`＋1）の2桁。序章 `common-01`、第九日 `common-10` |
| `chapter_title` | 解析された章名。章がなければ `扉・前付` | 場面の `h2` のテキスト |
| `page_number` | ページ添字＋1。ページ長設定で変動 | 場面添字＋1（1〜24） |
| `page_count` | 現在の総ページ数。ページ長設定で変動 | 場面総数（24） |
| `entry_method` | `reading_start` のみ: `start` / `resume` / `bookmark` | `reading_start` のみ: `start` / `bookmark` |
| `destination_route` | `reading_route_select` のみ: リンクURLから `rana`, `misha`, `mio`, `ritsu` を抽出。該当なしは `common` | 送信しない |
| `scene_id` | 送信しない | 場面HTMLのID（例 `day-9-2`） |
| `day_number` | 送信しない | 数値0〜9（0は序章） |
| `progress_percent` | 送信しない | `Math.round((index + 1) / scenes.length * 100)`。表示位置の百分率 |

作品比較には `story_id` ではなく **work_id** を使用し、章集計では `work_id`・`route_id`・`chapter_id`・`content_revision` を組み合わせます。章IDは順番に依存するため、改稿で章構成が変わる場合は版を分けます。ページ番号も作品間・設定間で同じ読書量を意味しません。

## 読了定義と重複防止

`reading_route_complete` は**末尾への前進到達**です。全ページの閲覧、本文を最後まで読むこと、滞在時間、全ルートの制覇を確認していません。末尾の直前へ目次で飛んだ後、1回前進しても発火します。末尾そのものへの目次移動、直リンク、再開、履歴移動、VXCのページ長変更では発火しません。末尾の「読了」表示や表紙へ戻る操作をクリックした時点のイベントでもありません。

開始・章初回・ルート到達完了の重複防止は、JavaScriptの変数・Setによる**1ドキュメント読み込み内**の処理です。リロードや別ルートへのページ遷移でリセットされます。ユーザー単位・セッション単位・永続的な一度きりの読了ではありません。

- VXC: 同一 `startId:endId` の連続描画を除外。別ページを経由して戻れば再計上。`settings` はページ閲覧を抑止しますが直前ページ識別値は更新し、未訪問章の表示なら章イベントは送ります。ルートクリック自体は重複防止しません。
- ペラギアン: 同一場面の連続描画を除外。表紙・無効ハッシュではイベントを送らず、直前場面をnullへ戻します。そのため表紙を経由した再表示もページ閲覧として数えます。開始・章・完了フラグは表紙へ戻っても維持します。
- 計測のための永続保存・送信リトライはありません。VXCのlocalStorageは既存の読書位置・設定保存であり、イベント重複防止には使いません。送信例外は読み進めを止めませんが、遮断中のイベントを後から回収する仕組みもありません。

## GA4カスタムディメンション

GA4の「管理 → データの表示 → カスタム定義」で既存登録を確認し、必要なものを**イベント**スコープで作成します。下記は登録する定義であり、実アカウントの登録済み状態をコードから保証するものではありません。

| 表示名 | イベントパラメータ | 対象 |
| --- | --- | --- |
| Work ID | `work_id` | 全3作品・作品横断集計の基本 |
| Work Title | `work_title` | 全3作品 |
| Route ID | `route_id` | 全3作品 |
| Chapter ID | `chapter_id` | 全3作品 |
| Chapter Title | `chapter_title` | 全3作品 |
| Content Revision | `content_revision` | 全3作品 |
| Reading Entry Method | `entry_method` | 開始イベント |
| Destination Route ID | `destination_route` | VXCのルート選択 |
| Story ID | `story_id` | 必要なら追加。ペラギアンのみ |
| Scene ID | `scene_id` | 必要なら追加。ペラギアンのみ |

`day_number` は日別分類が必要ならイベントスコープのディメンションとして追加できます。`page_number`、`page_count`、`progress_percent` は数値ですが、足し合わせても読書量・読了率になりません。通常はディメンションにせず、数値集計が必要な場合は定義を決めてカスタム指標を検討します。`progress_percent` の平均は全体の読了率ではありません。

カスタム定義のレポート反映には24〜48時間かかることがあります。登録前のデータがカスタム定義のレポートへ遡及反映されることを前提にしないでください。公式: [カスタム定義](https://support.google.com/analytics/answer/14240153?hl=ja)。

## DebugViewによる検証

ローカルテストが確認するのは発火ロジックであり、GA4側の受信ではありません。公開後、対象プロパティへアクセスできるアカウントで次を確認します。

1. ペラギアンは <https://games.syncworld.net/pelagian-legacy/?debug_mode=1> を開きます。ペラギアンとニューヨークのリーダーはクエリを解釈し、Googleタグのconfigに `debug_mode: true` を渡します。VXCにはこのクエリ処理がないため、Google Tag Assistantで対象URLのデバッグを有効にします。
2. GA4「管理 → データの表示 → DebugView」で対象デバイスを選択し、イベントを開いて測定先・上表のパラメータを確認します。通常の `page_view` と `reading_page_view` を区別します。
3. VXCは共通部・4ルートで初期表示、保存位置からの再開、ハッシュ直リンクを確認。開始方法が一致すること、目次で初回章だけ章イベントが出ること、同じ章内の往復はページ閲覧だけ増えることを確認します。
4. VXCの文字サイズ・明暗変更は読書イベントを増やさず、ページ長変更は `reading_page_view` と完了を増やさないことを確認（未訪問章表示の章イベントは例外）。目次と末尾のルートリンクで `destination_route` を確認します。
5. ペラギアンは表紙だけでは読書イベントがないこと、開始後の3イベント、前後・目次・本文タップ・履歴移動、日が変わると章イベントが出ること、表紙往復の扱いを確認します。
6. 各作品で新規読み込みして末尾へ直リンク・目次移動すると完了が出ないこと、末尾直前から前進すると `reading_route_complete` が1回出ること、同じ読み込みで再到達しても増えず、リロード後は再計上できることを確認します。
7. ペラギアンで100%表示位置でも直リンクなら完了イベントがないこと、VXCには `story_id` がないこと、未実装イベント名が送られないことを確認します。
8. 検証後はペラギアン・ニューヨークの `debug_mode` クエリを削除して読み直し、Tag Assistantを終了します。イベント遮断時はブラウザーの通信・同意状態等も確認します。

公式: [DebugView・Tag Assistant・デバッグ解除](https://support.google.com/analytics/answer/7201382?hl=ja)。本書更新時点ではGA4アカウントでの実受信・カスタム定義登録状態は未検証です。

## 作品追加・改稿時

1. 作品ディレクトリ・公開URL・作品一覧へのリンク・READMEを用意し、一意で安定した `work_id` と作品名、`route_id`、版識別子を決めます。両既存作品との比較には既存の `reading_*` と `work_id` を使います。`story_id` は現状の共通仕様ではなく、統一するなら別の実装変更として扱います。
2. 表示ページ・章・前付・分岐の対応、初回表示と開始方法、前進理由、末尾到達、ドキュメント内の重複防止を定義します。時間・スクロール・全章読了等を追加する場合は、既存仕様にあるとみなさず新仕様として設計します。
3. Googleタグを測定ID `G-M7PJD05WLR` で重複なく設定し、読書UIから送信処理を接続します。VXC方式なら `build.py` の作品データと生成対象も調整し、ソースと生成HTMLを同時に管理します。既存のURL・位置保存キー・移行データを不用意に変更しません。
4. 必要なディメンションが既存定義に含まれるか確認し、新パラメータだけを追加登録します。章構成変更では `content_revision` と章IDの対応を本書に記録します。
5. VXCは `python3 the-voynich-xcrossings/build.py` と `node --test the-voynich-xcrossings/tests/*.cjs` を実行。新作品の発火・非発火・重複防止と計測遮断時の読書操作を確認し、生成差分をレビューします。
6. mainへ公開し、上記DebugView検証を行い、実装済みイベント・対応作品・未実装項目を本書へ反映します。単に作品リンクを追加しても計測は自動追加されません。

既存の英語概要は [reading-analytics.md](reading-analytics.md) に残しています。本書は作品ごとの詳細な条件を補足する運用文書です。
