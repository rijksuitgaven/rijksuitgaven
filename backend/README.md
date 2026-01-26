# Rijksuitgaven API

FastAPI backend for Rijksuitgaven.nl - Dutch Government Spending Data.

## Quick Start

### Prerequisites

- Python 3.11+
- pip3

### Local Development

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip3 install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Run development server
uvicorn app.main:app --reload --port 8000
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI application
│   ├── config.py         # Environment configuration
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── health.py    # Health check endpoints
│   │       └── modules.py   # Module data endpoints
│   ├── services/         # Business logic
│   │   └── __init__.py
│   └── models/           # Database models
│       └── __init__.py
├── requirements.txt
├── Procfile             # Railway deployment
├── .env.example
└── README.md
```

## API Endpoints

### Health

- `GET /health` - Basic health check
- `GET /api/v1/health` - Detailed health with service status

### Modules

- `GET /api/v1/modules` - List all modules
- `GET /api/v1/modules/{module}` - Get aggregated data for a module
- `GET /api/v1/modules/{module}/{primary_value}/details` - Get row details

### Available Modules

| Module | Description | Rows |
|--------|-------------|------|
| `instrumenten` | Financiële Instrumenten | 674K |
| `apparaat` | Apparaatsuitgaven | 21K |
| `inkoop` | Inkoopuitgaven | 636K |
| `provincie` | Provinciale subsidies | 67K |
| `gemeente` | Gemeentelijke subsidies | 126K |
| `publiek` | Publieke uitvoeringsorganisaties | 115K |
| `integraal` | Cross-module search | - |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | Yes |
| `TYPESENSE_HOST` | Typesense server host | Yes |
| `TYPESENSE_API_KEY` | Typesense API key | Yes |
| `DEBUG` | Enable debug mode | No |

## Deployment

Deployed to Railway. Push to main triggers automatic deployment.

Railway URL: `https://rijksuitgaven-api-production-3448.up.railway.app`
