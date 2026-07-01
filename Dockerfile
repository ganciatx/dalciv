# Sivic Scraper dashboard — production image for Hostinger VPS (Docker Manager / deploy-on-vps).
FROM node:20-alpine AS portfolio-build
WORKDIR /app
COPY portfolio/package.json portfolio/package-lock.json ./portfolio/
RUN cd portfolio && npm ci
COPY portfolio ./portfolio
RUN cd portfolio && npm run build

FROM node:20-alpine AS city-budget-simulator-build
WORKDIR /app
COPY city-budget-simulator/package.json city-budget-simulator/package-lock.json ./city-budget-simulator/
RUN cd city-budget-simulator && npm ci
COPY city-budget-simulator ./city-budget-simulator
RUN cd city-budget-simulator && npm run build

FROM node:20-alpine AS time-timer-build
WORKDIR /app
COPY time-timer/package.json time-timer/package-lock.json ./time-timer/
RUN cd time-timer && npm ci
COPY time-timer ./time-timer
RUN cd time-timer && npm run build

FROM node:20-alpine AS crossword-constructor-build
WORKDIR /app
COPY crossword-constructor/package.json crossword-constructor/package-lock.json ./crossword-constructor/
RUN cd crossword-constructor && npm ci
COPY crossword-constructor ./crossword-constructor
RUN cd crossword-constructor && npm run build

FROM node:20-alpine AS city-budget-build
WORKDIR /app
COPY city-budget/package.json ./city-budget/
RUN cd city-budget && npm install
COPY city-budget ./city-budget
RUN cd city-budget && npm run build

FROM node:20-alpine AS council-accountability-build
WORKDIR /app
COPY council-accountability/package.json ./council-accountability/
RUN cd council-accountability && npm install
COPY council-accountability ./council-accountability
RUN cd council-accountability && npm run build

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
COPY apps ./apps
COPY dashboard ./dashboard
COPY --from=portfolio-build /app/dashboard/static/portfolio-site ./dashboard/static/portfolio-site
COPY --from=city-budget-simulator-build /app/dashboard/static/city-budget-simulator ./dashboard/static/city-budget-simulator
COPY --from=time-timer-build /app/dashboard/static/time-timer ./dashboard/static/time-timer
COPY --from=crossword-constructor-build /app/dashboard/static/crossword-constructor ./dashboard/static/crossword-constructor
COPY --from=city-budget-build /app/dashboard/static/city-budget ./dashboard/static/city-budget
COPY --from=council-accountability-build /app/dashboard/static/council-accountability ./dashboard/static/council-accountability
COPY images ./images

RUN mkdir -p scraper_dashboard_data dallas_legistar_downloads

EXPOSE 8765

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${DASHBOARD_PORT}/api/state" || exit 1

CMD ["python", "-m", "dashboard"]
