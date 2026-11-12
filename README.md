# SyncWorld Stories

SyncWorld作品のWeb試読版を公開する静的サイトです。リポジトリ名は `nseki/syncworld-games`、作品一覧は <https://games.syncworld.net/> です。

## 公開作品

| 作品 | 現行実装 | 公開URL |
| --- | --- | --- |
| The Voynich XCrossings（VXC） | 第6稿。共通部とラーナ・ミーシャ・澪・律の5リーダー。目次、文字サイズ・ページ長・明暗設定、読書位置保存、人物一覧 | <https://games.syncworld.net/the-voynich-xcrossings/> |
| ペラギアンの遺産 | Ver. 2.1。序章と九日間の24場面。写真、目次、前後リンク・本文タップ、ハッシュURLによる場面移動 | <https://games.syncworld.net/pelagian-legacy/> |
| ニューヨークは異世界だった | 第1巻（Vol. 1）Web試読版 v1.3a。全7話と巻末おまけ、前後のチュートリアルを収録。見出し単位の46ページ、目次・前後移動、GA4読書イベント | <https://games.syncworld.net/ny-isekai/> |

VXCの個別URLは `the-voynich-xcrossings/` 以下の `rana/`、`misha/`、`mio/`、`ritsu/`。澪エンド後に律の後日譚が続きます。操作の詳細は[作品README](the-voynich-xcrossings/README.md)も参照してください。作品一覧にもペラギアンの旧版表記（1.2）が残っていますが、作品ページは2.1です。

## ディレクトリ

```text
index.html                       # 作品一覧（手編集）
CNAME                            # games.syncworld.net
.nojekyll                        # 静的ファイルの配信
README.md
 docs/                           # 計測・運用ドキュメント
 the-voynich-xcrossings/
   build.py                      # Python標準ライブラリのみで生成
   manuscript.md                 # 共通部原稿
   reading-migrations.json       # 旧版の読書位置対応
   characters.json               # 公開人物データ
   src/                          # template.html / reader.css / reader-core.js / app.js / analytics.js
   index.html                    # 生成済み共通部
   rana/, misha/, mio/, ritsu/    # 各原稿・位置対応・生成index.html
   characters/index.html         # 生成人物一覧
   credits/, assets/             # 図版クレジット・画像
 pelagian-legacy/
   index.html                    # 本文・CSS・読書UI・計測を含む手編集HTML
   photos/                       # WebP写真
 ny-isekai/
   index.html                    # 第1巻 v1.3a の本文・目次
   reader.js                     # 改ページ・GA4読書イベント
```

## ビルドと確認

リポジトリのルートで実行します。VXCはPython 3で生成し、Node.jsの組み込みテストで確認します。パッケージのインストールやサーバー側処理はありません。GA4は外部のGoogleタグを、ペラギアンはローカルの写真を読み込みます。

```sh
python3 the-voynich-xcrossings/build.py
node --test the-voynich-xcrossings/tests/*.cjs
python3 -m http.server 8000
```

ブラウザーで `http://localhost:8000/` を開き、各作品・ルートの目次、前後移動、画像、VXCの再開・設定を確認します。VXCのソースを更新した場合は、共通部・4ルート・人物一覧の生成HTMLも差分を確認してコミットします。ペラギアンとニューヨーク作品にはビルドスクリプトがなく、HTMLを直接更新します。

## 公開

GitHub Pagesの既存設定は **Deploy from a branch / main / /(root)**、カスタムドメインは `games.syncworld.net`。`CNAME`、`.nojekyll` を維持します。リポジトリに独自の `.github/workflows/` はありません。ビルド済み静的ファイルをmainへコミット・pushするとPagesが公開します（上記のローカルビルドをPagesが代行する構成ではありません）。

1. 最新mainを取得し、ソース・生成物とテスト結果を確認。
2. 意図したファイルだけをコミットし、`git push origin main`。
3. GitHubのPages公開結果を確認し、上の公開URLで表示・移動・画像を確認。
4. 計測に関わる更新では、[GA4読書イベント仕様と検証手順](docs/analytics.md)のDebugView確認を実施。

## 読書イベント計測

測定IDは `G-M7PJD05WLR`。VXC、ペラギアン、ニューヨーク作品は `reading_*` イベントを送信します。作品横断分析には `work_id` を使います。`story_id` は現在ペラギアンのみです。イベント、発火条件、読了の限界、重複防止、カスタムディメンション、作品追加手順は [docs/analytics.md](docs/analytics.md) を参照してください。
