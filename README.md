# 和菓子シミュレーター

和菓子の配置シミュレーションアプリケーションです。

## 機能

- 和菓子の配置シミュレーション
- 管理画面（商品・カテゴリー・在庫管理）
- 管理者認証システム

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase PostgreSQL
- **ORM**: Prisma
- **認証**: NextAuth.js
- **ファイルストレージ**: Supabase Storage
- **スタイリング**: Tailwind CSS
- **開発環境**: Docker

## セットアップ

このアプリケーションは2つのデータベース環境をサポートしています：

1. **Supabase PostgreSQL**（本番推奨・デフォルト）
2. **ローカルPostgreSQL**（開発用・Docker Compose）

環境変数 `USE_LOCAL_DB` で切り替えが可能です。

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd wagashi-nextjs
```

### 2. データベース環境の選択

#### オプション A: ローカルPostgreSQL（開発用・推奨）

ローカル開発では、Docker ComposeでPostgreSQLコンテナを使用することを推奨します。

```bash
# 環境変数ファイルをコピー
cp env.example .env.local

# ローカルPostgreSQLに切り替え
./scripts/switch-db.sh local

# または手動で設定
# .env.localで USE_LOCAL_DB=true に設定
```

**ローカルPostgreSQLの利点:**
- インターネット接続不要
- 高速なレスポンス
- 開発データの完全な制御
- ネットワーク制限の影響なし
- 画像もローカルファイルシステムに保存（public/uploads/products/）

#### オプション B: Supabase PostgreSQL（本番用）

本番環境や、Supabaseの機能（Storage、Auth等）を使用する場合はこちらを選択してください。画像はSupabase Storageに保存されます。

### 3. Supabaseプロジェクトの作成（Supabase使用時のみ）

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. データベースのパスワードを設定（強力なパスワードを推奨）
4. プロジェクトの設定から以下の情報を取得：
   - Project URL
   - API Keys（anon public key と service_role key）
   - Database URL（Settings > Database > Connection string > URI）

### 4. ストレージバケットの作成（Supabase使用時のみ）

1. Supabaseダッシュボードで「Storage」に移動
2. 「Create a new bucket」をクリック
3. バケット名を「images」に設定
4. 「Public bucket」にチェックを入れる
5. 「Create bucket」をクリック

### 5. RLS（Row Level Security）ポリシーの設定（Supabase使用時のみ）

Supabaseダッシュボードの「SQL Editor」で以下のクエリを実行：

```sql
-- 画像の読み取りを全員に許可
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'images');

-- 認証済みユーザーのみアップロード・削除を許可
CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete" ON storage.objects 
FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```

### 6. 環境変数の設定

#### ローカルPostgreSQL使用時

```bash
# 環境変数ファイルをコピー（まだの場合）
cp env.example .env.local

# ローカルPostgreSQLに切り替え
./scripts/switch-db.sh local
```

切り替えスクリプトが自動的に以下を行います：
- `USE_LOCAL_DB=true` に設定
- `DATABASE_URL` と `DIRECT_URL` をローカル用に変更
- Supabase用のURLをコメントアウト

#### Supabase使用時

```bash
# Supabaseに切り替え
./scripts/switch-db.sh supabase
```

事前に`.env.local`にSupabaseの設定情報を追加しておく必要があります：

```env
# Supabase（必須）
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_PROJECT_ID=your-supabase-project-id

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

切り替えスクリプトが自動的に以下を行います：
- `USE_LOCAL_DB=false` に設定
- `DATABASE_URL` と `DIRECT_URL` をSupabase用に変更
- ローカル用のURLをコメントアウト

**重要**: 
- `[YOUR-PASSWORD]`をSupabaseプロジェクト作成時に設定したデータベースパスワードに置き換え
- `[YOUR-PROJECT-REF]`をプロジェクトリファレンスに置き換え
- **すべての値を実際の値に置き換えてから次のステップに進んでください**

**接続方式の説明**:
- `DATABASE_URL`: 接続プール経由（通常のアプリケーション処理用）
- `DIRECT_URL`: 直接接続（マイグレーションやスキーマ変更用）

### 7. 開発環境のセットアップ

#### ローカルPostgreSQL使用時

```bash
# 1. ローカル環境に切り替え
./scripts/switch-db.sh local

# 2. 依存関係のインストール
docker compose -f compose.local.yml run --rm app pnpm install

# 3. データベースのセットアップ
docker compose -f compose.local.yml run --rm app pnpm db:local:setup

# 4. 開発環境を起動
docker compose -f compose.local.yml up
```

#### Supabase使用時

**注意**: 環境変数の設定が完了してから実行してください。

```bash
# 1. Supabase環境に切り替え
./scripts/switch-db.sh supabase

# 2. 依存関係のインストール
docker compose run --rm app pnpm install

# 3. データベースのセットアップ
docker compose run --rm app pnpm db:local:setup

# 4. 開発環境を起動
docker compose up
```

### 8. 既存データの移行（オプション）

既存のローカルデータベースからSupabaseに移行する場合：

```bash
# 移行スクリプトの実行
SOURCE_DATABASE_URL="postgresql://wagashi_user:wagashi_password@localhost:5432/wagashi_simulator" \
DATABASE_URL="your-supabase-database-url" \
tsx scripts/migrate-to-supabase.ts
```

### 9. アプリケーションにアクセス

- メインアプリ: http://localhost:3000
- 管理画面: http://localhost:3000/admin

## データベース・ストレージ環境の切り替え

### 自動切り替えスクリプト

```bash
# ローカルPostgreSQL + ローカルファイルストレージに切り替え
./scripts/switch-db.sh local

# Supabase PostgreSQL + Supabase Storageに切り替え
./scripts/switch-db.sh supabase
```

### 手動切り替え

`.env.local`ファイルの`USE_LOCAL_DB`を変更：

```env
# ローカルPostgreSQL + ローカルファイルストレージ使用
USE_LOCAL_DB=true

# Supabase PostgreSQL + Supabase Storage使用
USE_LOCAL_DB=false
```

### ストレージの動作

| 環境 | データベース | 画像ストレージ | 保存場所 |
|------|-------------|---------------|----------|
| ローカル | PostgreSQL (Docker) | ローカルファイルシステム | `public/uploads/products/` |
| Supabase | Supabase PostgreSQL | Supabase Storage | `images` バケット |

### Docker Composeファイルの使い分け

```bash
# ローカルPostgreSQL（PostgreSQLコンテナ含む）
docker compose -f compose.local.yml up

# Supabase（アプリケーションのみ）
docker compose up

# 本番環境
docker compose -f compose.production.yml up
```

### データベース固有のコマンド

```bash
# ローカルPostgreSQL用
pnpm dev:local              # ローカルDB使用で開発サーバー起動
pnpm db:local:setup         # ローカルDBの初期セットアップ
pnpm db:local:reset         # ローカルDBのリセット

# Supabase用
pnpm types:generate         # Supabase型定義生成
pnpm migrate:supabase       # Supabaseへのデータ移行
```

## 環境変数が未設定の場合のエラー対処

もし`docker compose build`時に以下のようなエラーが発生した場合：

```
Error: supabaseUrl is required.
```

これはSupabaseの環境変数が設定されていないことが原因です。以下の手順で解決してください：

1. **環境変数の確認**: `.env.local`ファイルにSupabaseの設定がすべて記載されているか確認
2. **値の設定**: 空の値（`""`）ではなく、実際のSupabaseプロジェクトの値を設定
3. **再ビルド**: 環境変数を設定後、`docker compose up --build`を再実行

### 最小限の環境変数設定例

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PROJECT_ID=your-project-id
DATABASE_URL=postgresql://postgres.your-project:password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.your-project:password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## 管理画面

### ログイン情報

初期管理者アカウント:
- メール: `admin@example.com`
- パスワード: `I9mJCaDrscR06kV`

### 機能

1. **ダッシュボード**
   - 統計情報の表示
   - クイックアクション

2. **カテゴリー管理**
   - カテゴリーの作成・編集・削除
   - カテゴリー名と説明の管理

3. **商品管理**
   - 商品の作成・編集・削除
   - 商品詳細情報の管理
   - 画像アップロード機能
   - サイズ設定（2x2, 2x3, 3x3, 3x4, 4x4）

4. **在庫管理**
   - 商品ごとの在庫数の表示・更新
   - リアルタイム在庫管理

5. **アカウント管理**
   - 管理者ユーザーの作成・削除
   - 権限管理（管理者・スーパー管理者）

## 開発

### 利用可能なスクリプト

#### 基本コマンド

```bash
# 開発サーバーの起動
pnpm dev                    # 通常の開発サーバー
pnpm dev:local              # ローカルDB使用で開発サーバー

# ビルド・本番
pnpm build                  # 本番用ビルド
pnpm start                  # 本番サーバーの起動
```

#### データベース関連

```bash
# 共通
pnpm db:generate            # Prismaクライアントの生成
pnpm db:push                # データベーススキーマの同期
pnpm db:migrate             # マイグレーションの実行
pnpm db:seed                # シードデータの投入
pnpm db:studio              # Prisma Studioの起動

# ローカルPostgreSQL専用
pnpm db:local:setup         # ローカルDBの初期セットアップ
pnpm db:local:reset         # ローカルDBのリセット
pnpm storage:local:clean    # ローカル画像ストレージのクリーンアップ

# Supabase専用
pnpm types:generate         # Supabase型定義の生成
pnpm migrate:supabase       # Supabaseへのデータ移行
pnpm db:test                # データベース接続テスト
```

### E2Eテストの実行

```bash
# 開発サーバーを起動
pnpm dev

# 別のターミナルでE2Eテストを実行
# テスト用データベースのセットアップも含む
pnpm test:e2e:setup

# または、データベースリセットなしでテストのみ実行
pnpm test:e2e

# テスト用データベースのみリセット
pnpm db:reset:test

# Dockerを使用する場合
docker compose -f compose.local.yml up -d
docker compose -f compose.local.yml exec app pnpm test:e2e:docker:setup

# または、専用のテストサービスを使用
docker compose -f compose.local.yml --profile test run --rm test
```

#### 固定IDについて

E2Eテストでは、データベースリセット時にIDが変わる問題を解決するため、以下の固定IDを使用しています：

- **店舗ID**: `test-store-001` (新宿店)
- **商品ID**: `test-product-001` (桜餅), `test-product-002` (どら焼き)

これにより、データベースをリセットしてもテストが安定して実行されます。

#### 利用可能なE2Eテスト

- **店舗選択テスト** (`store-selection.spec.ts`)
  - 店舗一覧の表示
  - 店舗選択とシミュレーターへの遷移
  - エラーハンドリング

- **和菓子シミュレーターテスト** (`wagashi-simulator.spec.ts`)
  - 和菓子のドラッグ&ドロップ配置
  - 配置した和菓子の移動
  - 和菓子の回転機能
  - 和菓子の削除機能
  - ダブルクリックによる詳細モーダル表示
  - レイアウトのクリア機能

### プロジェクト構造

```
wagashi-nextjs/
├── app/                    # Next.js App Router
│   ├── admin/              # 管理画面
│   │   ├── login/          # ログインページ
│   │   ├── categories/     # カテゴリー管理
│   │   ├── products/       # 商品管理
│   │   ├── stock/          # 在庫管理
│   │   └── accounts/       # アカウント管理
│   └── api/                # API Routes
│       └── admin/          # 管理画面API
├── components/             # Reactコンポーネント
│   ├── admin/              # 管理画面用コンポーネント
│   └── ui/                 # UIコンポーネント
├── lib/                    # ユーティリティ
├── prisma/                 # Prisma設定
│   ├── schema.prisma       # データベーススキーマ
│   └── seed.ts             # シードデータ
├── public/                 # 静的ファイル
└── scripts/                # 各種スクリプト
```

## データベーススキーマ

### 主要テーブル

- **AdminUser**: 管理者ユーザー
- **Category**: 商品カテゴリー
- **Product**: 商品情報
- **Stock**: 在庫情報

## トラブルシューティング

### Prismaクライアントエラー

```bash
# Prismaクライアントを再生成
pnpm db:generate

# データベースを再同期
pnpm db:push
```

### ビルドエラー

```bash
# 依存関係を再インストール
rm -rf node_modules
pnpm install

# Prismaクライアントを再生成
pnpm db:generate

# Supabase型定義を再生成
pnpm types:generate
```

### Docker Build エラー

#### `Error: supabaseUrl is required.` エラー

このエラーはビルド時にSupabaseの環境変数が設定されていない場合に発生します。

**解決方法**:
1. `.env.local`ファイルが存在し、すべてのSupabase環境変数が設定されていることを確認
2. 環境変数の値が空文字列（`""`）ではなく、実際の値が設定されていることを確認
3. 以下のコマンドで環境変数を確認：
   ```bash
   cat .env.local | grep SUPABASE
   ```
4. 環境変数を正しく設定後、コンテナを再ビルド：
   ```bash
   docker compose down
   docker compose up --build
   ```

### ストレージ関連のエラー

#### ローカルストレージエラー

1. **ディレクトリの権限確認**
   ```bash
   # アップロードディレクトリの作成・権限設定
   mkdir -p public/uploads/products
   chmod 755 public/uploads/products
   ```

2. **ディスク容量の確認**
   ```bash
   # 利用可能な容量を確認
   df -h .
   ```

3. **ローカル画像のクリーンアップ**
   ```bash
   # ローカル画像ストレージをクリーンアップ
   pnpm storage:local:clean
   ```

#### Supabase Storageエラー

1. **環境変数の確認**
   ```bash
   # .env.localファイルでSupabase設定を確認
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

2. **バケットの確認**
   - Supabaseダッシュボードで「images」バケットが存在することを確認
   - バケットがpublicに設定されていることを確認

3. **RLSポリシーの確認**
   - Storage > Policies で適切なポリシーが設定されていることを確認

#### ストレージ切り替え時の注意

1. **画像の移行**
   - ローカル ↔ Supabase 切り替え時、既存の画像は自動移行されません
   - 必要に応じて手動で画像を再アップロードしてください

2. **URL形式の違い**
   - ローカル: `http://localhost:3000/uploads/products/filename.jpg`
   - Supabase: `https://project.supabase.co/storage/v1/object/public/images/products/filename.jpg`

#### 接続エラー

```bash
# Supabaseクライアントの再インストール
pnpm remove @supabase/supabase-js
pnpm add @supabase/supabase-js
```

#### PostgreSQL 接続がブロックされる/タイムアウトする場合

企業ネットワークや厳格なファイアウォール環境では、SupabaseのPostgreSQL（直通: 5432, プーラー: 6543）への外向き通信がブロックされ、`pnpm db:push` や Prisma Studio、アプリ実行時にタイムアウト/接続失敗することがあります。以下を確認してください。

1. **接続ポートを開放**
   - 可能であればネットワーク管理者に依頼し、以下の外向き通信を許可:
     - 5432/tcp（ダイレクト接続）
     - 6543/tcp（接続プール PgBouncer/Supavisor 経由・推奨）
   - 接続先ホストは `.env.local` の `DATABASE_URL`/`DIRECT_URL` に記載の Supabase ホスト（例: `aws-0-ap-northeast-1.pooler.supabase.com`）。

2. **疎通確認（タイムアウト切り分け）**
   - ネットワーク越しに TLS で握手できるか確認:
     ```bash
     # プール経由（推奨 6543）
     openssl s_client -connect aws-0-ap-northeast-1.pooler.supabase.com:6543 -brief </dev/null
     # 直通（5432）
     openssl s_client -connect aws-0-ap-northeast-1.pooler.supabase.com:5432 -brief </dev/null
     ```
   - 成功すれば TLS ハンドシェイク情報が表示、ブロック時はタイムアウト/接続拒否になります。

3. **接続文字列のSSL/プール設定を有効化（重要）**
   - 企業ネットワークでは SSL 必須のことが多いため、`sslmode=require` を付け、アプリ処理はプール経由を使用してください。
   - `.env.local` の最小例（置換必須）:
     ```env
     # アプリ処理用（プール経由）
     DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
     # マイグレーション/スキーマ変更用（直通）。直通がブロックされる場合は一時的に許可を依頼
     DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
     ```
   - Prisma を使用する場合はプール経由での長時間クエリが苦手なため、マイグレーションは基本 `DIRECT_URL` を使用します。直通が使えない場合はネットワーク例外許可を依頼してください。

4. **タイムアウトの調整（任意）**
   - ネットワークが不安定な場合、接続/アイドルタイムアウトを延長:
     ```env
     # Prisma（例）
     DATABASE_URL="...&pgbouncer=true&sslmode=require&connection_limit=5&connect_timeout=15"
     ```

5. **プロキシ/WSL2/ローカル環境の考慮**
   - **HTTP/HTTPS プロキシのみ**では PostgreSQL の TCP は通りません。ネットワーク側の TCP 許可が必要です。
   - **WSL2/Windows ファイアウォール**で `docker`, `node`, `pnpm` 等の外向き通信が許可されているか確認。
   - 一時回避として、別ネットワーク（テザリング/自宅回線/VPN）で疎通できるか試し、ネットワーク要因かを切り分け。

6. **どうしてもポートが開けられない場合の代替案**
   - 短期的にはマイグレーション・シード等は接続可能な環境で実行し、本番はアプリからプール経由（6543/SSL）でのみアクセス。
   - ネットワークポリシー上の恒久対応は管理者にご相談ください。

### Supabase の IP 制限（Allowlist）設定

Supabase ではデータベースへのアクセス元 IP を制限できます。企業ネットワークや本番環境でのセキュリティ強化に有効ですが、誤設定すると自分自身が接続できなくなるため、必ず現在の接続元 IP を先に登録してから有効化してください。

#### 前提
- IP 制限は有料プランで利用可能な場合があります。プロジェクトのプラン/機能可用性を事前に確認してください。
- 制限対象は以下を個別に有効化できます：
  - 直通 PostgreSQL（5432）
  - 接続プール PgBouncer/Supavisor（6543）

#### 設定場所（ダッシュボード）
1. Supabase ダッシュボードにログイン
2. 対象プロジェクトを選択
3. `Settings` > `Database` > `Network`（もしくは `Settings` > `Network restrictions`）
4. `Restrict access to Postgres`（5432）と `Restrict access to PgBouncer`（6543）を必要に応じて有効化
5. `Allowed IP addresses / CIDR` に許可したい送信元を追加

#### 追加する IP/CIDR の例
- 単一 IPv4: `203.0.113.10/32`
- 単一 IPv6: `2001:db8::1234/128`
- 範囲指定（例: 社内 NAT 範囲）: `203.0.113.0/24`

```bash
# 自分の現在のグローバルIPを確認（IPv4）
curl -4 ifconfig.me
# IPv6 も必要なら
curl -6 ifconfig.me
```

#### 環境別の登録ガイド
- **ローカル開発/WSL2**: 自宅/会社のグローバル IP を `/32` で登録。動的 IP の場合は頻繁に更新が必要。
- **Docker/社内プロキシ**: 実際に外に出る egress NAT の IP を登録（開発端末のローカル IP では不可）。
- **Vercel/Netlify 等のホスティング**: プラットフォームの固定 egress IP 範囲を登録。Vercel は[固定 egress アドオン]等の利用を検討。
- **CI/CD（GitHub Actions 等）**: 固定 egress IP がない場合が多いです。マイグレーションは別経路（VPN/踏み台）で実施、または一時的に IP 制限を解除して短時間で完了させる運用を検討。

#### 安全な切り替え手順（ロックアウト防止）
1. まず現在の接続元 IP（自分/本番/監視/ジョブ）を全て登録
2. 既存接続の動作確認（`openssl s_client` や `psql` で疎通）
3. `Restrict access` を有効化
4. 別セッションで接続確認（Next.js アプリ、Prisma、Prisma Studio、`pnpm db:push`）
5. 問題なければ適用完了。問題があれば即座にロールバック

#### 検証コマンド（許可結果の確認）
```bash
# PgBouncer（6543）
openssl s_client -connect aws-0-ap-northeast-1.pooler.supabase.com:6543 -brief </dev/null
# Postgres 直通（5432）
openssl s_client -connect aws-0-ap-northeast-1.pooler.supabase.com:5432 -brief </dev/null
```
- 失敗時の代表例: `no pg_hba.conf entry for host ...` またはタイムアウト。IP 許可に漏れがないか確認。

#### Prisma/接続文字列の注意
- IP 制限により接続可否が決まるだけで、接続文字列の形式自体は変わりません。引き続き `sslmode=require` を強く推奨します。
- `.env.local` 例:
  ```env
  DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true&sslmode=require"
  DIRECT_URL="postgresql://...:5432/postgres?sslmode=require"
  ```

#### よくある落とし穴
- 自分の IP を登録する前に `Restrict` を有効化して接続不能になる
- PgBouncer 側のみ許可/制限して直通（またはその逆）を失念
- 動的 IP 環境での更新漏れ
- CI/CD の egress IP が固定でない前提を見落とし

## デプロイ

### 本番環境での注意事項

1. **環境変数**
   - `NEXTAUTH_SECRET`を強力な値に変更
   - `DATABASE_URL`を本番用に設定
   - `NEXTAUTH_URL`を本番URLに設定
   - Supabase環境変数を本番用に設定

2. **セキュリティ**
   - 管理者パスワードの変更
   - HTTPSの設定
   - ファイアウォールの設定
   - SupabaseのRLSポリシーの確認

3. **バックアップ**
   - データベースの定期バックアップ
   - Supabaseストレージは自動でバックアップされます

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## TO DO List

自動化の仕組みの確立
電光掲示板に商品一覧を表示、客が商品をおして詰め合わせ作成
自動レジに送信、キャッチして中で詰める