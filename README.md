# Lumina microservices

Lumina is now split into two independently runnable Node.js services. There are no external package dependencies.

## Project layout

```text
microservice-application/
├── auth-service/       # Authentication API and user data
├── task-service/       # Task CRUD API and task data
├── frontend/           # Login, registration, dashboard, JavaScript, and CSS
├── .gitignore
├── package.json
└── README.md
```

The auth service serves the files in `frontend/`, keeping browser assets separate from service code while still providing a simple local development entry point.

## Services

| Service | Default port | Responsibility |
| --- | --- | --- |
| `auth-service` | `3001` | Registration, login, logout, sessions, and user data. It also serves the browser UI. |
| `task-service` | `3002` | Task creation, listing, completion status, deadlines, priorities, and deletion. |

The task service does not store or validate passwords. For every task request, it forwards the browser session cookie to the auth service's `/api/session` endpoint and uses the verified user identity returned there.

## Run locally

Start each service in its own terminal from the repository root:

```powershell
npm run start:auth
```

```powershell
npm run start:tasks
```

Then open [http://localhost:3001](http://localhost:3001).

## Configuration

| Service | Variable | Default | Purpose |
| --- | --- | --- | --- |
| Auth | `PORT` | `3001` | Auth service listening port. |
| Auth | `NODE_ENV` | — | Set to `production` behind HTTPS to mark cookies `Secure`. |
| Task | `PORT` | `3002` | Task service listening port. |
| Task | `AUTH_SERVICE_URL` | `http://localhost:3001` | URL of the auth service for session validation. |
| Task | `WEB_ORIGIN` | `http://localhost:3001` | Allowed UI origin for browser requests. |

## Browser features

- Register with username, email, and password
- Log in and out with session cookies
- Create user-private tasks
- Choose Low, Medium, or High priority
- Add an optional deadline
- Mark tasks Completed or reopen them as Pending
- Delete tasks

## Data ownership

- `auth-service/data/users.json` contains user information and password hashes.
- `task-service/data/tasks.json` contains task records only.

Passwords are salted and hashed with PBKDF2-SHA256; they are never stored in the task service. Sessions use `HttpOnly` and `SameSite=Lax` cookies and expire after eight hours.

## HTTP APIs

### Auth service (`http://localhost:3001`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/register` | Creates a user and begins a session. |
| `POST` | `/api/login` | Authenticates a user and begins a session. |
| `GET` | `/api/session` | Returns the authenticated user from the session cookie. |
| `POST` | `/api/logout` | Ends the active session. |

### Task service (`http://localhost:3002`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | Lists the signed-in user's tasks. |
| `POST` | `/api/tasks` | Creates a task with title, priority, and optional deadline. |
| `PATCH` | `/api/tasks/:id` | Changes task status to `pending` or `completed`. |
| `DELETE` | `/api/tasks/:id` | Deletes a task belonging to the signed-in user. |
