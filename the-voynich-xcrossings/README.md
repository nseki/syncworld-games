# The Voynich XCrossings

第一部〜第四部・第3稿のWeb試読版。背景・立ち絵・音声・分岐を付けず、ページ送りで文章のテンポを確認します。

公開先: https://games.syncworld.net/the-voynich-xcrossings/

## 操作

- 本文クリック／タップ、Space、→、PageDown: 次のページ
- ←、PageUp、Shift+Space: 前のページ
- 目次: 章の移動。未読の章名は隠します
- 文字・表示: 文字サイズ、ページ長、明暗の変更
- 読書位置と表示設定はブラウザー内に保存。`#at=段落番号` で位置を共有できます

`index.html` 単体をダウンロードしても読めます。

## ソース

`manuscript.md` が原稿、`src/` が表示と操作、`build.py` が単独HTMLの生成、`tests/` が原文保持・ページ分割・再開位置などのチェックです。

```sh
python3 build.py
node --test tests/reader.test.cjs
```

現在は第一部〜第四部の第3稿を公開しています。
GUIブラウザーでの表示確認は未実施です。
