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

## 2. Run the frontend (new terminal)

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                        # http://localhost:3000
```

Open **http://localhost:3000** and log in.

---

## Demo accounts

All use password **`password123`**:

| Role | Email |
|------|-------|
| Fleet Manager | manager@transitops.in |
| Dispatcher | dispatch@transitops.in |
| Safety Officer | safety@transitops.in |
| Financial Analyst | finance@transitops.in |

The login screen has one-click buttons to fill each account.

---

## Demo walkthrough (proves every business rule)

1. Log in as **Dispatcher**.
2. **Fleet** → note Van-05 (500 kg, Available); the Retired and In-Shop vehicles.
3. **Drivers** → Alex is Available; John is Suspended, Priya On Trip, Suresh Off Duty.
4. **Trips** → Create Trip. The vehicle/driver dropdowns only list eligible ones
   (suspended/expired/on-trip are hidden). Pick Van-05 + Alex, cargo 450 kg → within
   capacity. Bump cargo above 500 kg → red **"capacity exceeded → dispatch blocked"**.
5. Set cargo back and **Dispatch** → Van-05 and Alex both flip to On Trip; Dashboard
   Active Trips ticks up.
6. On the Live Board, **Complete** the trip (enter final odometer + fuel) → both return
   to Available; a fuel log is created.
7. As **Fleet Manager**, go to **Maintenance** → log a service on Van-05 → it becomes
   In Shop and disappears from the Trips dispatch pool. **Close** it → back to Available.
8. **Analytics** → fuel efficiency, utilization, operational cost, ROI, costliest-vehicle
   chart. **Export CSV**.

---

## Business rules (all enforced server-side in `backend/fleet/services.py`)

1. Vehicle registration number is unique.
2. Retired / In-Shop vehicles never appear in dispatch selection.
3. Expired-license or Suspended drivers cannot be assigned.
4. A vehicle/driver already On Trip cannot be assigned again.
5. Cargo weight cannot exceed vehicle capacity.
6. Dispatching sets both vehicle and driver to On Trip.
7. Completing sets both back to Available (records odometer + fuel).
8. Cancelling a dispatched trip restores both to Available.
9. Opening a maintenance record sets the vehicle to In Shop.
10. Closing maintenance restores the vehicle to Available (unless Retired).

RBAC is enforced by DRF permission classes in `backend/fleet/permissions.py`:
Fleet Manager → vehicles + maintenance; Dispatcher → trips; Safety Officer → drivers;
Financial Analyst → fuel + expenses. Everyone authenticated can read.

---

## Bonus features included

- **Charts & visual analytics** (Recharts on the Analytics screen)
- **Search, filters & sorting** (Vehicles and Drivers tables, wired to API query params)
- **CSV export** (Analytics screen → Export CSV)

---

## Project structure

```
transitops/
├── backend/
│   ├── config/            # Django project (settings, urls)
│   └── fleet/
│       ├── models.py      # 8 entities
│       ├── services.py    # business-rule engine (all 10 rules)
│       ├── permissions.py # RBAC
│       ├── serializers.py
│       ├── views.py       # ViewSets + dispatch/complete/cancel/close actions
│       └── management/commands/seed.py
└── frontend/
    ├── app/               # 9 screens (login, dashboard, vehicles, drivers,
    │                      #   trips, maintenance, fuel, analytics, settings)
    ├── components/        # Layout, StatusBadge, ui helpers
    └── lib/               # api client, auth context
```
