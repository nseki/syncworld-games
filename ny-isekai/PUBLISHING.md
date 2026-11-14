# 『ニューヨークは異世界だった』GitHub Pages 公開手順

## 正本と公開先

- **原稿の正本**：private repository `nseki/stories` の `ny-essays/books/volume-01/` および `ny-essays/books/volume-02/editions/`。第2巻の基準版は `v0.3.md`。掲載順比較版 `v0.3meta.md`、`v0.3gemini.md`、`v0.3claude.md` は公開原稿とは区別する。
- **公開先**：`nseki/syncworld-games` の GitHub Pages、`https://games.syncworld.net/ny-isekai/`。
- `ny-isekai/index.html`：巻一覧。各巻の読者向けURLは `ny-isekai/vol-1/` と `ny-isekai/vol-2/`。今後は `vol-3/` のように増やす。
- 各巻の `index.html` と `reader.js` は同じディレクトリに置く。既存の `ny-isekai/reader.js` は移行時の元ファイルとして保持。

## 既存の読書仕様を固定

1. **Markdownの `##` は巻内の話／冒頭／おまけの開始、`###` は小見出し**。各 `##` と `###` から新しい `section[data-chapter]` を作り、そこで改ページする。小見出しのない話は1ページ。
2. `id` は `tutorial`、`chapter-1` ～ `chapter-7`、`bonus` を基準に、各小見出しに `-section-2` などを付ける。目次のアンカーと前後リンクは全ページに対して生成し、ページ番号も更新する。
3. **既存の第1巻 `reader.js` の動作を維持**：ページを1つずつ表示、前へ／次へ、目次、URLハッシュによるブックマーク、ブラウザの戻る／進む。スマートフォンでは本文領域のタップで次ページへ（リンク・操作部・選択テキスト等を除外）。タッチだけでなく通常のクリックにも対応。
4. 第1巻から抽出したCSSを共通のデザイン基準とする。既存の見た目や操作を理由なく作り直さない。`[hidden]` の表示制御、ダークモード、アクセシビリティを維持する。
5. `reader.js` の計測用 `work_id` と `content_revision` は巻ごとに適切な値とし、GA設定とイベント名を不用意に変更しない。
6. ページは横書きWeb表示。**EPUBの縦書き制作手順とは別**であり、EPUB用CSSを流用しない。

## 更新時のチェックリスト

1. private `stories` の著者承認済み対象版を確認。原稿の文章を推測で補ったり、無断で改稿したりしない。
2. 第1巻を更新する場合は現行 `vol-1/index.html` を起点に差分を確認。第2巻は `v0.3.md` の `##`／`###` に従ってHTMLのページ・目次・ナビゲーションを再生成する。
3. **章の順番・本文・各小見出しのテキストが元原稿と一致するか確認**。すべての目次アンカーと前後リンクが存在し、ページ番号が連続するか確認。
4. PCとiPhoneで目次、タップ改ページ、前後リンク、戻る操作、ページ内リンク、ダークモードを試す。最初と最後のページで例外がないか確認。
5. 公開前に第三者・家族のプライバシーと外部事実確認の完了状況を確認。試読版には `noindex,nofollow` を維持する。
6. `nseki/syncworld-games` にコミットし、GitHub Pagesへの反映後に `/ny-isekai/`、`/ny-isekai/vol-1/`、`/ny-isekai/vol-2/` の実URLで確認する。**コミット成功だけで公開動作確認済みとはしない**。
7. 原稿の版名・公開先・検証状況を `stories` の編集管理文書にも反映する。

## 2026-11-13 の移行

従来の `ny-isekai/index.html`（第1巻v1.4a）と `reader.js` を `vol-1/` に複製し、旧URLは巻一覧に変更。第2巻v0.3基準掲載順を `vol-2/` に追加。第1巻の本文やページ分割は変更していない。新規ページの実機表示とPages反映は別途確認が必要。
