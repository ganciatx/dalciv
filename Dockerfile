# Sivic Scraper dashboard — production image for Hostinger VPS (Docker Manager / deploy-on-vps).
FROM python:3.12-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DASHBOARD_HOST=0.0.0.0 \
    DASHBOARD_PORT=8765 \
    SCRAPER_ENABLED=0 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app

# System deps for Playwright Chromium + healthcheck curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && playwright install --with-deps chromium

COPY dallas_legistar_scraper.py .
COPY legistar_url_parsing.py .
COPY dashboard ./dashboard
COPY images ./images

RUN mkdir -p scraper_dashboard_data dallas_legistar_downloads

EXPOSE 8765

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${DASHBOARD_PORT}/api/state" || exit 1

CMD ["python", "-m", "dashboard"]
