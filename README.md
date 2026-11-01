# Syncworld Games

ゲームと試読版の公開用リポジトリです。作品ごとにディレクトリを分けています。

| 作品 | 公開URL |
| --- | --- |
| The Voynich XCrossings | https://games.syncworld.net/the-voynich-xcrossings/ |

GitHub Pages: `main` ブランチの `/(root)` を公開。カスタムドメインは `games.syncworld.net`。

## 更新

```sh
cd the-voynich-xcrossings
python3 build.py
node --test tests/reader.test.cjs
```

生成された `index.html` もコミットします。外部依存、インストール、サーバー処理はありません。
