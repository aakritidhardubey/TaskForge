# ⚡ TaskForge

A full-stack project management web application with role-based access control, built with **Python (FastAPI)** and **React**.

## 🚀 Features

- **Authentication** — Signup/Login with JWT tokens
- **Projects** — Create, manage, and delete projects
- **Team Management** — Invite members, assign Admin or Member roles
- **Tasks** — Create, assign, filter, and track tasks with status & priority
- **Dashboard** — Overview of tasks, statuses, overdue items, and stats
- **Role-Based Access Control** — Admins manage members and all tasks; Members manage their own tasks
- **Fully Responsive** — Dark-themed, modern UI

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT via `python-jose`, bcrypt passwords |
| Frontend | React 18, React Router v6, Axios |
| Build | Vite 5 |
| Deployment | Railway (Nixpacks) |

## 📁 Project Structure

```
taskforge/
├── backend/
│   ├── main.py              # FastAPI app entry point, serves frontend
│   ├── config.py            # Environment settings
│   ├── database.py          # SQLAlchemy engine & session
│   ├── models.py            # DB models (User, Project, ProjectMember, Task)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── auth.py              # JWT utilities, password hashing, guards
│   ├── requirements.txt
│   └── routers/
│       ├── auth_router.py   # POST /auth/signup, /auth/login, GET /auth/me
│       ├── projects_router.py  # CRUD projects + member management
│       ├── tasks_router.py  # CRUD tasks per project
│       └── dashboard_router.py # Aggregated stats
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx          # Router with public/private guards
│   │   ├── index.css        # Global design system
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── api.js       # Axios instance with JWT interceptors
│   │   ├── components/
│   │   │   └── Sidebar.jsx
│   │   └── pages/
│   │       ├── AuthPage.jsx
│   │       ├── Dashboard.jsx
│   │       ├── ProjectsList.jsx
│   │       └── ProjectDetail.jsx
│   ├── package.json
│   └── vite.config.js       # Proxies /api to backend; builds to backend/static
│
├── nixpacks.toml            # Railway build config
├── railway.toml             # Railway deploy config
└── .env.example
```

## ⚙️ Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env as needed
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. The Vite dev server proxies `/api` to the backend at `http://localhost:8000`.

### Production Build (optional locally)

```bash
cd frontend && npm run build
# Then the backend serves the built React app from backend/static/
cd ../backend && uvicorn main:app --port 8000
```

## 🌐 Deploy to Railway

### One-Click Deploy

1. Push this repository to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select your repo → Railway auto-detects `nixpacks.toml`

### Add PostgreSQL (Recommended for Production)

1. In Railway dashboard → **+ New** → **Database** → **PostgreSQL**
2. Copy the `DATABASE_URL` from the PostgreSQL service
3. Add it as an environment variable to your app service

### Environment Variables

Set these in Railway's Variables tab:

| Variable | Example | Required |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://...` | Yes (or uses SQLite) |
| `SECRET_KEY` | `random-64-char-string` | **Yes — change this!** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | No (default: 1440) |

Generate a strong secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## 🔐 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Register |
| POST | `/api/auth/login` | No | Login → JWT |
| GET | `/api/auth/me` | Yes | Current user |

### Projects
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | Member | List my projects |
| POST | `/api/projects` | Any | Create project (creator=admin) |
| GET | `/api/projects/{id}` | Member | Get project details |
| PUT | `/api/projects/{id}` | Admin | Update project |
| DELETE | `/api/projects/{id}` | Admin | Delete project |

### Members
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/projects/{id}/members` | Admin | Invite member |
| PUT | `/api/projects/{id}/members/{mid}` | Admin | Change role |
| DELETE | `/api/projects/{id}/members/{mid}` | Admin | Remove member |

### Tasks
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/projects/{id}/tasks` | Member | List tasks (filterable) |
| POST | `/api/projects/{id}/tasks` | Member | Create task |
| GET | `/api/projects/{id}/tasks/{tid}` | Member | Get task |
| PUT | `/api/projects/{id}/tasks/{tid}` | Member* | Update task |
| DELETE | `/api/projects/{id}/tasks/{tid}` | Member* | Delete task |

*Members can only modify tasks they created or are assigned to. Admins can modify any task.

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | Yes | Aggregated stats |

## 🗂 Data Models

### Task Status Flow
```
todo → in_progress → review → done
```

### Priority Levels
`low` · `medium` · `high` · `critical`

### Roles
- **Admin** — Full control: manage members, all tasks, project settings
- **Member** — Create tasks, update their own tasks

## 📝 License

MIT
