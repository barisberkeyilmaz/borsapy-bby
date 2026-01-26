# borsapy-web

BIST hisse tarama ve analiz web uygulaması. borsapy kütüphanesi ile güçlendirilmiştir.

## Özellikler

- **Hisse Tarama (Screener)**: F/K, PD/DD, temettü verimi ve daha fazla kritere göre filtreleme
- **Hisse Detay**: Fiyat bilgileri ve temel metrikler
- **Portföy Yönetimi**: Hisse takibi ve performans analizi (yakında)
- **Teknik Tarama**: RSI, MACD gibi indikatörlere göre sinyal taraması (yakında)
- **Backtest**: Strateji test motoru (yakında)
- **Endeksler**: BIST endeks takibi

## Teknoloji Stack

### Frontend
- Next.js 14+ (App Router)
- Tailwind CSS + shadcn/ui
- TanStack Query
- Zustand

### Backend
- FastAPI
- borsapy

## Kurulum

### Geliştirme Ortamı

#### Backend

```bash
cd apps/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Çalıştır
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd apps/frontend
pnpm install

# .env.local dosyası oluştur
cp .env.local.example .env.local

# Çalıştır
pnpm dev
```

### Docker ile Çalıştırma

```bash
# Geliştirme
cd docker
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up --build
```

## API Endpoints

### Screener API

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/screener/templates` | GET | Hazır şablonlar |
| `/api/screener/templates/{name}` | GET | Şablon sonuçları |
| `/api/screener/run` | POST | Custom filtreler |
| `/api/screener/criteria` | GET | Filtre kriterleri |
| `/api/screener/sectors` | GET | Sektör listesi |

### Stocks API

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/stocks/{symbol}` | GET | Hisse bilgisi |
| `/api/stocks/{symbol}/history` | GET | Fiyat geçmişi |
| `/api/stocks/{symbol}/fast-info` | GET | Hızlı fiyat |
| `/api/stocks/search` | GET | Arama |

### Market API

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/market/summary` | GET | Piyasa özeti |

## Proje Yapısı

```
borsapy-web/
├── apps/
│   ├── frontend/           # Next.js frontend
│   │   └── src/
│   │       ├── app/        # App Router pages
│   │       ├── components/ # React components
│   │       ├── hooks/      # Custom hooks
│   │       ├── lib/        # API client, utils
│   │       └── store/      # Zustand state
│   │
│   └── backend/            # FastAPI backend
│       └── app/
│           ├── routers/    # API endpoints
│           ├── schemas/    # Pydantic models
│           └── services/   # Business logic
│
├── docker/                 # Docker configs
├── turbo.json             # Turborepo config
└── package.json           # Monorepo root
```

## Doğrulama

- [ ] Backend: `curl http://localhost:8000/api/screener/templates` çalışıyor
- [ ] Frontend: Screener sayfası template listesi gösteriyor
- [ ] Filtre uygulandığında sonuçlar güncelleniyor
- [ ] Dark mode varsayılan olarak aktif
- [ ] Polling ile veriler otomatik yenileniyor

## Lisans

MIT
