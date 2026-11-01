# The Voynich XCrossings

共通部第一〜四部・第4稿のWeb試読版。個別ルートは現在の公開範囲から外しています。旧原稿は別に保持しています。

公開先: https://games.syncworld.net/the-voynich-xcrossings/

## 操作

- 本文クリック／タップ、Space、→、PageDown: 次のページ
- ←、PageUp、Shift+Space: 前のページ
- 目次で章へ移動。未読の章名は伏せます。
- 文字サイズ、ページ長、明暗を変更できます。
- 読書位置をブラウザーに保存。旧稿の位置は同じ章の近い箇所へ移します。旧個別ルートの位置は共通部の試読末尾へ移します。
- 最初から読む場合は `?draft=4#at=0&rev=draft4-v1`。

## ソースと検証

`manuscript.md` が公開原稿、`src/` が表示と操作です。

```sh
python3 build.py
node --test tests/reader.test.cjs
```

`index.html` は外部依存のない単独HTMLです。`reading-migrations.json` は第3稿の各版から第4稿への段落対応を含みます。`misha/index.html` は旧ブックマーク用の案内だけを表示し、本文や次ルートのリンクは公開しません。
