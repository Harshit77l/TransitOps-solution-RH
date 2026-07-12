# TransitOps — Smart Transport Operations Platform

A fleet operations platform: vehicle registry, driver management, trip dispatching,
maintenance, fuel/expense tracking, and analytics — with all business rules enforced
server-side and role-based access control.

- **Backend:** Django + Django REST Framework + SQLite + JWT (simplejwt)
- **Frontend:** Next.js (App Router) + Tailwind + TanStack Query + Axios + Recharts

---

## Prerequisites

- Python 3.10+
- Node.js 18+

---

## 1. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate           # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed              # loads demo users, vehicles, drivers
python manage.py runserver         # http://localhost:8000
```

The API is served under `http://localhost:8000/api/`.