"""FastAPI backend for borsapy web application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import screener, stocks, indices, scanner, backtest, market

app = FastAPI(
    title="borsapy API",
    description="API for BIST stock screening, analysis and portfolio management",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(screener.router, prefix="/api/screener", tags=["screener"])
app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(indices.router, prefix="/api/indices", tags=["indices"])
app.include_router(scanner.router, prefix="/api/scanner", tags=["scanner"])
app.include_router(backtest.router, prefix="/api/backtest", tags=["backtest"])
app.include_router(market.router, prefix="/api/market", tags=["market"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "borsapy API", "version": "1.0.0"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
