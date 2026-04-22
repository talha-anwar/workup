# WorkUp

Initial scaffold for a full-stack WorkUp application.

## Structure

- `backend/`: Python backend modules and API routers.
- `frontend/`: React frontend source scaffold.

## Environment setup

1. Copy each example env file:
   - `.env.example` -> `.env` (optional global vars)
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env`
2. Fill in real values before running the app.

## Git init

From the project root:

```bash
git init
git add .
git commit -m "chore: initialize WorkUp scaffold"
```

## Run locally

### Backend

```bash
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn main:app --reload
```

Backend URL: `http://127.0.0.1:8000`  
Health check: `http://127.0.0.1:8000/health`
FastAPI Docs: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://127.0.0.1:5173`
