# SmartOps - Smart Operations Management System

A full-stack operations management system built with React.js, Node.js, Express.js, and MongoDB. Companies can manage projects, assign tasks, track progress, and monitor team workload with role-based access control.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Database Design](#database-design)
- [API Documentation](#api-documentation)
- [Setup Instructions](#setup-instructions)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Key Technical Decisions](#key-technical-decisions)
- [Known Limitations](#known-limitations)

---

## Features

### Authentication & Authorization
- User registration and login with JWT-based authentication
- Secure password hashing using bcrypt (10 salt rounds)
- Three roles: **Admin**, **Manager**, **Employee**
- Role-based access control enforced on every API endpoint

### Project Management
- Managers can create, update, and manage projects
- Projects include name, description, start date, deadline, status, and team members
- Project statuses: Planning, Active, On Hold, Completed, Cancelled
- Employees can only view projects they are assigned to

### Task Management
- Tasks belong to projects with title, description, priority, status, assignee, and due date
- Priority levels: Low, Medium, High, Critical
- Status workflow: TODO → IN_PROGRESS → REVIEW → COMPLETED
- Invalid status transitions are rejected (e.g., TODO directly to COMPLETED)
- Tasks can only be assigned to project team members
- Employees can only update status of tasks assigned to them
- Comment system on each task

### Dashboard
- All data computed from the database via aggregation pipelines (no hardcoded data)
- Total, active, and completed project counts
- Pending, overdue, and completed task counts
- Task status and priority distribution
- Employee workload analysis (Manager/Admin only)
- Project progress (% of tasks completed per project)
- Recent overdue tasks list

### Search, Filtering & Pagination
- Text search on project names and task titles
- Filter by status, priority, assignee, and date ranges
- Sorting by multiple fields
- Server-side pagination with configurable page size (max 50)

### Activity / Audit History
- Tracks all important changes: project creation, status changes, task assignments, priority changes, comments
- Records: user, action, entity, previous value, new value, timestamp
- Filterable by project, task, or user
- Displayed on project detail pages and task detail pages

### Business Rules (Backend Enforced)
- Employees can only update tasks assigned to them
- Employees can only change task status (not priority, assignee, etc.)
- Tasks can only be assigned to project team members
- Invalid status transitions are rejected
- Project deadline must be after start date
- Unauthorized API access returns 401/403

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18 + Vite |
| UI Routing | React Router v6 |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Icons | React Icons (Feather) |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose ODM |
| Authentication | JWT + bcryptjs |
| Validation | express-validator |
| Security | Helmet, CORS, Rate Limiting |
| Testing | Jest + Supertest + mongodb-memory-server |

---

## Architecture Overview

```
┌─────────────────┐     HTTP/REST      ┌──────────────────┐     Mongoose     ┌──────────────┐
│   React Client  │ ←───────────────→  │  Express Server  │ ←──────────────→ │   MongoDB    │
│   (Vite SPA)    │                    │   (REST API)     │                  │   (Atlas)    │
└─────────────────┘                    └──────────────────┘                  └──────────────┘
```

### Backend Structure
```
server/
├── src/
│   ├── config/           # App config & DB connection
│   ├── controllers/      # Business logic for each resource
│   ├── middleware/        # Auth, validation middleware
│   ├── models/           # Mongoose schemas (User, Project, Task, Activity)
│   ├── routes/           # Express route definitions
│   ├── utils/            # Helper functions (activity logger, seeder)
│   ├── validators/       # express-validator rule sets
│   ├── __tests__/        # Test suites
│   └── index.js          # Express app entry point
```

### Frontend Structure
```
client/
├── src/
│   ├── api/              # Axios instance with interceptors
│   ├── components/       # Reusable UI components (Layout, Common)
│   ├── context/          # React Context for auth state
│   ├── pages/            # Page-level components
│   ├── utils/            # Formatting and helper functions
│   ├── App.jsx           # Root component with routes
│   └── main.jsx          # Entry point
```

---

## Database Design

### User
| Field | Type | Description |
|-------|------|-------------|
| name | String | Full name (required) |
| email | String | Unique, lowercase (required) |
| password | String | Hashed with bcrypt, not returned in queries |
| role | Enum | admin, manager, employee |
| timestamps | Date | createdAt, updatedAt |

### Project
| Field | Type | Description |
|-------|------|-------------|
| name | String | Project name (required) |
| description | String | Optional details |
| startDate | Date | Project start (required) |
| deadline | Date | Must be after startDate (required) |
| status | Enum | planning, active, on_hold, completed, cancelled |
| manager | ObjectId → User | Project creator/manager |
| teamMembers | [ObjectId → User] | Assigned team members |

### Task
| Field | Type | Description |
|-------|------|-------------|
| title | String | Task title (required) |
| description | String | Optional details |
| project | ObjectId → Project | Parent project (required) |
| assignee | ObjectId → User | Assigned employee |
| priority | Enum | low, medium, high, critical |
| status | Enum | todo, in_progress, review, completed |
| dueDate | Date | Required |
| comments | [{ user, text, timestamps }] | Embedded subdocuments |

### Activity (Audit Log)
| Field | Type | Description |
|-------|------|-------------|
| user | ObjectId → User | Who performed the action |
| action | String | E.g. status_change, task_created |
| entityType | Enum | project or task |
| entityId | ObjectId | ID of the entity |
| entityName | String | Human-readable entity name |
| projectId | ObjectId → Project | Related project |
| previousValue | String | Value before change |
| newValue | String | Value after change |
| details | String | Description of the change |

### Indexes
- User: email (unique), role
- Project: manager, status, teamMembers, text(name, description)
- Task: project+status (compound), assignee, priority, dueDate, text(title, description)
- Activity: entityType+entityId, projectId, user, createdAt (desc)

---

## API Documentation

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login and get JWT | Public |
| GET | /api/auth/me | Get current user | Authenticated |
| GET | /api/auth/users | List all users | Admin, Manager |

### Projects
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/projects | List projects (paginated) | Authenticated |
| POST | /api/projects | Create project | Admin, Manager |
| GET | /api/projects/:id | Get project details | Authenticated (members only for employees) |
| PUT | /api/projects/:id | Update project | Admin, Project Manager |
| DELETE | /api/projects/:id | Delete project + tasks | Admin |

### Tasks
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/projects/:id/tasks | Create task in project | Admin, Manager |
| GET | /api/projects/:id/tasks | List tasks in project | Authenticated |
| GET | /api/tasks/all | List all tasks (cross-project) | Authenticated |
| GET | /api/tasks/:id | Get task details | Authenticated |
| PUT | /api/tasks/:id | Update task | Assignee (status only), Manager/Admin (all fields) |
| DELETE | /api/tasks/:id | Delete task | Admin, Manager |
| POST | /api/tasks/:id/comments | Add comment | Authenticated |

### Dashboard & Activity
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/dashboard | Get dashboard stats | Authenticated |
| GET | /api/activities | Get activity log | Authenticated |

### Query Parameters (Projects/Tasks)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 50)
- `search` - Text search
- `status` - Filter by status
- `priority` - Filter by priority (tasks)
- `assignee` - Filter by assignee ID (tasks)
- `sortBy` - Sort field
- `order` - asc or desc
- `dueBefore` / `dueAfter` - Date range filters (tasks)

---

## Setup Instructions

### Prerequisites
- Node.js v18+ and npm
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd smart-ops
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB connection string and JWT secret
npm install
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
```

### 4. Seed the Database (Optional)
```bash
cd backend
npm run seed
```

This creates sample users, projects, and tasks. Test accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartops.com | admin123 |
| Manager | rahul@smartops.com | manager123 |
| Manager | priya@smartops.com | manager123 |
| Employee | amit@smartops.com | employee123 |
| Employee | sneha@smartops.com | employee123 |
| Employee | vikram@smartops.com | employee123 |

### 5. Run the Application
```bash
# Option A: From root directory
npm run dev:backend    # Starts backend on http://localhost:5000
npm run dev:frontend   # Starts frontend on http://localhost:5173

# Option B: From individual folders
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## Running Tests

```bash
# From root
npm test

# Or from backend directory
cd backend
npm test
```

Tests use `mongodb-memory-server` for an isolated in-memory database. Test categories:
- **Authentication**: Registration, login, token validation
- **Authorization**: Role-based access (admin, manager, employee)
- **Task Creation & Assignment**: Project-member-only assignment
- **Status Transitions**: Valid/invalid workflow transitions
- **Business Rules**: Employee restrictions, date validation

---

## Deployment

### Backend (Render / Railway)
1. Create a new Web Service
2. Set root directory to `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables (MONGO_URI, JWT_SECRET, CLIENT_URL)

### Frontend (Vercel / Render / Netlify)
1. Create a new static site
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variable: `VITE_API_URL=<your-backend-url>/api`

### Important Notes
- Set `CLIENT_URL` in backend env to your frontend deployment URL (for CORS)
- Set `VITE_API_URL` in frontend env to your backend deployment URL + `/api`
- Never commit `.env` files or credentials to Git

---

## Key Technical Decisions

1. **Embedded Comments**: Task comments are stored as embedded subdocuments rather than a separate collection. This simplifies queries since comments are always fetched with their task, and the 16MB document limit is sufficient for typical task comment volumes.

2. **Status Transition Validation**: The valid transition map is defined as a static method on the Task model, keeping the business rule close to the data model and ensuring it's consistently applied.

3. **Activity Logging as Fire-and-Forget**: Audit log entries are written asynchronously and don't block the main response. If logging fails, it's caught and logged to console but doesn't affect the user's operation.

4. **Server-Side Pagination**: All list endpoints use `skip` + `limit` pagination with total count for proper page navigation. Maximum page size is capped at 50 to prevent abuse.

5. **Role-Based Filtering**: Instead of separate endpoints per role, the same endpoint adapts its query based on the user's role (e.g., employees only see their assigned projects/tasks).

6. **JWT in Authorization Header**: Using Bearer token scheme rather than cookies for stateless API authentication, making it straightforward for any frontend framework.

7. **MongoDB Indexes**: Strategic indexes on frequently queried fields (status, assignee, project+status compound index) for efficient query performance.

---

## Known Limitations

1. **No Real-time Updates**: The system uses REST polling; WebSocket-based real-time notifications would improve UX for multi-user scenarios.
2. **No File Uploads**: Task attachments are not supported in the current version.
3. **No Password Reset**: Forgot password / email verification flow is not implemented.
4. **Basic Rate Limiting**: Rate limiting is global per IP; more sophisticated per-user limits could be added.
5. **No Task Dependencies**: Tasks cannot depend on other tasks (blocking/blocked-by relationships).
6. **Single Assignment**: Each task can only be assigned to one person; some workflows may need multiple assignees.
