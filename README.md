# SmartStore AI — Intelligent Inventory & Vendor Management Platform

SmartStore AI is a full-stack web application that helps small and medium retail businesses automate inventory management, supplier communication, and business reporting. It combines a React frontend, FastAPI backend, PostgreSQL database, and AI/LLM integration to eliminate manual stock tracking, automate purchase orders, and provide intelligent business insights.

---

## Architecture

┌─────────────────────────────────────────┐
│           React Frontend (Vite)          │
│  Dashboard │ Products │ Suppliers │ POs  │
│  Invoice Upload │ Reports │ AI Chat      │
└────────────────────┬────────────────────┘
│ REST API + JWT
┌────────────────────▼────────────────────┐
│         FastAPI Backend (Python)         │
│  Auth │ Products │ Suppliers │ POs       │
│  AI Chat │ OCR Parser │ Scheduler        │
└──────┬─────────────────────┬────────────┘
│                     │
┌──────▼──────┐    ┌─────────▼────────┐
│  PostgreSQL  │    │   Groq LLM API   │
│  Database    │    │  llama-3.1-8b    │
└─────────────┘    └──────────────────┘

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite | 18.x |
| Styling | Tailwind CSS | 4.x |
| State Management | Zustand | 4.x |
| Charts | Recharts | 2.x |
| HTTP Client | Axios | 1.x |
| Backend | FastAPI | 0.x |
| Language | Python | 3.11+ |
| ORM | SQLAlchemy | 2.x |
| Validation | Pydantic v2 | 2.x |
| Database | PostgreSQL | 18.x |
| Auth | JWT (python-jose) + bcrypt | - |
| AI/LLM | Groq API (llama-3.1-8b-instant) | - |
| OCR | Groq Vision (llama-4-scout) | - |
| Scheduler | APScheduler | 3.x |
| Containerization | Docker + Docker Compose | - |

---

## Modules

- **Module A — Inventory Dashboard**: Product catalogue with stock health indicators, summary cards, search and filter
- **Module B — Supplier & PO Management**: Supplier directory, purchase order creation with line items, status workflow
- **Module C — AI Store Assistant**: Chat interface grounded in real database data using intent-based tool routing
- **Module D — Demand Forecast API**: 7-day moving average forecast shown as a line chart on product detail page
- **Module E — Invoice OCR Parser**: Vision LLM extracts supplier name, date, and line items from invoice images
- **Module F — Agentic Automation**: APScheduler runs low-stock alert and expiry alert jobs automatically

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/smartstore-ai.git
cd smartstore-ai
```

### 2. Backend setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Environment variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and fill in your values
```

Required variables:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/smartstore_db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GROQ_API_KEY=your_groq_api_key_here

### 4. Create the database
```bash
psql -U postgres
CREATE DATABASE smartstore_db;
\q
```

### 5. Run the backend
```bash
cd backend
uvicorn app.main:app --reload
```
Backend runs at: http://127.0.0.1:8000
API docs at: http://127.0.0.1:8000/docs

### 6. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

### 7. Default admin account
Register via the API docs or use:
- Email: admin@smartstore.com
- Password: admin123

---

## Docker Setup

```bash
docker-compose up --build
```

This starts:
- PostgreSQL on port 5432
- FastAPI backend on port 8000
- React frontend on port 5173

---

## Running Automation Jobs Manually

Via API docs (http://127.0.0.1:8000/docs):
- `POST /reports/trigger/low-stock` — runs low stock alert job
- `POST /reports/trigger/expiry` — runs expiry alert job

Via frontend:
- Go to **Reports** page → click **Trigger Now**

Scheduled times:
- Low stock alert: daily at 8:00 AM
- Expiry alert: daily at 8:30 AM

---

## AI/LLM Provider

**Provider**: Groq (https://console.groq.com)

**Models used**:
- Chat assistant: `llama-3.1-8b-instant` — fast, free, reliable for intent detection and natural language responses
- Invoice OCR: `meta-llama/llama-4-scout-17b-16e-instruct` — vision model for extracting structured data from invoice images

**Why Groq**: Free tier with generous rate limits, extremely fast inference, and good support for structured output generation. Ideal for a demo/assessment project.

**AI Architecture**: Instead of native tool calling API (which had compatibility issues with available free models), we use intent-based routing — the user message is analyzed for keywords, the appropriate database query is executed, and the real data is injected into the LLM prompt. This guarantees data grounding with zero hallucination of stock numbers.

---

## Demand Forecast

**Method**: Simple Moving Average (last 30 days of stock history)

**Reasoning**: The dataset is small and new (no historical sales data exists yet), making complex models like ARIMA or Prophet overkill. A moving average gives plausible, stable forecasts and is easy to explain. With more data, this could be upgraded to exponential smoothing or Prophet for seasonality detection.

---

## Known Limitations

- No real email sending — PO emails are mocked (logged to console/DB)
- Forecast accuracy is limited due to minimal stock history data
- No real-time WebSocket updates — dashboard requires manual refresh
- Single tenant only — no multi-store support
- JWT refresh tokens not implemented — users must re-login after 30 minutes

---

## What I Would Improve With More Time

- Implement WebSocket for real-time stock updates
- Add multi-tenant support with store isolation
- Use Prophet or ARIMA for better demand forecasting
- Add real SMTP email sending for POs
- Implement JWT refresh token rotation
- Add comprehensive pytest test suite
- Deploy to Railway or Render with CI/CD pipeline

---

## AI-Assisted Development

Claude (Anthropic) was used as a coding assistant throughout this project for code suggestions, debugging, and architecture decisions. All code was reviewed, understood, and customized for this specific use case. I am able to explain and extend any part of the codebase.

---

## Sample Invoices

Two sample invoices are included in `/docs`:
- `sample_invoice_1.pdf` — PDF format invoice
- `sample_invoice_2.png` — PNG format invoice

Both can be uploaded to the Invoice Upload page to test the OCR parser.