FROM node:24

# Playwrightの依存関係をインストール
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY ./package.json ./
COPY ./prisma ./prisma

# Copy lockfile (if present) before installing to ensure deterministic installs
COPY ./pnpm-lock.yaml ./

# Pin pnpm to a stable v8 release and run non-interactive install using the lockfile
# `CI=true` avoids interactive prompts in CI (Render). `--frozen-lockfile` enforces the lockfile.
RUN npm install -g pnpm@8.8.0 && CI=true pnpm install --frozen-lockfile --reporter=append-only

COPY . .
RUN pnpm build

# Playwrightブラウザをインストール
RUN pnpm exec playwright install --with-deps chromium

# 本番用の依存関係のみ残す（テスト時は除く）
RUN if [ "$NODE_ENV" != "test" ]; then CI=true pnpm prune --prod; fi

ENV PLAYWRIGHT_BASE_URL=http://localhost:3000

EXPOSE 3000

CMD ["pnpm", "start"]
