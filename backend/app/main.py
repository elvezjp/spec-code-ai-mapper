"""spec-code-ai-mapper backend"""

import os
from importlib.metadata import version

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routers import convert, review, organize, split

# pyproject.tomlからバージョンを取得
APP_VERSION = version("spec-code-ai-mapper-backend")

app = FastAPI(
    title="spec-code-ai-mapper API",
    description="spec-code-ai-mapper API for design-to-code mapping",
    version=APP_VERSION,
)

# CORS設定（環境変数で制御、デフォルトは全許可）
# 本番環境では CORS_ORIGINS=https://example.com を設定
cors_origins_str = os.getenv("CORS_ORIGINS", "*")
cors_origins = ["*"] if cors_origins_str == "*" else [o.strip() for o in cors_origins_str.split(",")]
# オリジンを限定していない状態で認証情報を許可すると、Starlette は
# Access-Control-Allow-Origin にリクエスト元の Origin をそのまま返す
# （ワイルドカードと認証情報は併用できない仕様のため）。結果として
# 任意のサイトがこの API へ資格情報付きで到達し、応答を読めてしまう。
# ローカル起動中に利用者が悪意あるページを開くと、レビュー対象の
# コードや設計書が読み取られうるため、全許可のときは認証情報を許可しない。
# Starlette は "*" が1つでも含まれれば全許可として扱う（allow_all_origins =
# "*" in allow_origins）ため、"*,https://app.example.com" のような混在指定も
# 全許可とみなして認証情報を許可しない。
allow_credentials = "*" not in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(convert.router, prefix="/api/convert", tags=["convert"])
app.include_router(review.router, prefix="/api", tags=["review"])
app.include_router(organize.router, prefix="/api", tags=["organize"])
app.include_router(split.router, prefix="/api", tags=["split"])

@app.get("/health")
async def health_check():
    """ヘルスチェック（ルートレベル）- ALB用"""
    return {"status": "healthy", "version": APP_VERSION}

# フロントエンドの静的ファイル配信
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend"

# 静的ファイル（画像など）を配信
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")


