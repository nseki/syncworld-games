# The Voynich XCrossings

共通部第一〜四部・第6稿のWeb試読版。ラーナ・ミーシャ・澪・律エピローグの第6稿を独立した読書ページで公開しています。目次と各リーダー末尾のリンクから移動できます。

公開先: https://games.syncworld.net/the-voynich-xcrossings/

## 操作

- 本文クリック／タップ、Space、→、PageDown: 次のページ
- ←、PageUp、Shift+Space: 前のページ
- 目次で章へ移動。未読の章名は伏せます。
- 文字サイズ、ページ長、明暗を変更できます。
- 読書位置をブラウザーに保存。対応表のある旧稿の位置を現行稿へ移します。ルートごとに保存位置を保持します。
- 最初から読む場合は `?draft=6#at=0&rev=draft6-v5`。

## ソースと検証

`manuscript.md` が公開原稿、`src/` が表示と操作です。

```sh
python3 build.py
node --test tests/*.cjs
```

`index.html` は本文・表示・読書イベント処理を埋め込んだHTML（GA4のGoogleタグとローカル図版を別途読み込みます）です。`reading-migrations.json` は対応する旧稿から現行稿への段落対応を含みます。`rana/` と `misha/` は共通第四部から分岐する独立したルートで、それぞれ読書位置を保存します。共通部の読書位置は維持します。

## 全ルート

画面上部の「目次」には表示中の原稿の章一覧と、第五部ラーナ・第六部ミーシャ・第七部澪・第八部律の後日譚へのリンクがあります。末尾のリンクから共通部へ戻ることもできます。各ページで読書位置を別に保存します。推奨順はこの記載順です。澪までが独立した分岐で、律の後日譚は澪エンド後の続きです。

「文字・表示」の「読書記録をリセット」は確認後に共通部・全ルートの保存位置と既読記録を削除し、表示中のリーダーの冒頭へ戻ります。表示設定は保持します。

## 人物一覧

各試読ページの上部「人物一覧」で、本文を離れずに名前と初登場時の役割を確認できます。独立したページは `characters/`。公開データは `characters.json` のみで、作者用の背景資料や未公開の正体を含めません。原稿、版番号、読書位置の保存仕様は変更していません。


## 読書イベント計測

測定IDは `G-M7PJD05WLR`、作品横断分析のキーは `work_id`、VXCの値は `the-voynich-xcrossings` です。`route_id` は `common / rana / misha / mio / ritsu`。VXCは `story_id` を送信しません。

`src/analytics.js` が `reading_start`、`reading_page_view`、`reading_chapter_view`、`reading_route_select`、`reading_route_complete` を扱い、`src/app.js` から呼び出します。`build.py` が共通部と4ルートに埋め込みます。

`reading_route_complete` は前進操作で末尾へ到達した記録です。全ページ閲覧・滞在時間・全章読了・全ルート読了を保証しません。開始・章初回表示・末尾到達完了の重複防止はドキュメント読み込み単位です。

発火条件・パラメータ・未実装事項・改稿時の注意は、詳細仕様の [docs/analytics.md](../docs/analytics.md) を参照してください。ローカルテストの成功はGA4での受信確認ではありません。実受信は同文書のTag Assistant・DebugView手順で別途確認します。
