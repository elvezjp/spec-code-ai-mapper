"""main.py の単体テスト"""

from fastapi.testclient import TestClient

from app.main import APP_VERSION, app

client = TestClient(app)


class TestHealthCheck:
    """health_check() のテスト"""

    def test_health_check_returns_status_before_static_mount(self):
        """UT-MAIN-001: /health が静的ファイル配信に隠れず応答する"""
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "healthy", "version": APP_VERSION}
