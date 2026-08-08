# Lumina task manager

Lumina is a Node.js task-management application with account registration, secure login, and a private task dashboard for each user.

## Features

- Register with a username, email address, and password
- Sign in and sign out with secure cookie-based sessions
- Personalized welcome message using the saved username
- Create multiple tasks
- Set each task’s priority: Low, Medium, or High
- Add an optional deadline date
- Track task status: Pending or Completed
- Mark a task complete or reopen it
- Delete tasks
- Keep users and tasks persistent and isolated per account

## Run locally

The project has no external dependencies; it uses Node.js built-in modules only.

```powershell
npm start
```

Open these pages in your browser:

- Login: [http://localhost:3000](http://localhost:3000)
- Registration: [http://localhost:3000/register.html](http://localhost:3000/register.html)
- Task dashboard: [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)

The dashboard requires an authenticated session. Login and registration redirect users there automatically.

## Demo account

On first start, the app creates a demo account:

- Email: `demo@lumina.local`
- Password: `ChangeMe123!`

To set a different demo password before the first server start:

```powershell
$env:DEMO_PASSWORD = 'YourSecurePassword'
npm start
```

## Stored data

| File | Contents |
| --- | --- |
| `data/users.json` | Usernames, email addresses, and password hashes. |
| `data/tasks.json` | User-owned tasks, priorities, deadlines, and status. |

Both data files are excluded from Git by `.gitignore`.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/register` | Creates a user and starts a session. |
| `POST` | `/api/login` | Authenticates a user and starts a session. |
| `GET` | `/api/session` | Returns the signed-in user. |
| `POST` | `/api/logout` | Ends the current session. |
| `GET` | `/api/tasks` | Lists tasks for the signed-in user. |
| `POST` | `/api/tasks` | Creates a task with `title`, `priority`, and optional `deadline`. |
| `PATCH` | `/api/tasks/:id` | Changes a task status to `pending` or `completed`. |
| `DELETE` | `/api/tasks/:id` | Deletes one of the signed-in user’s tasks. |

## Security

- Passwords are salted and hashed with PBKDF2-SHA256; plain-text passwords are not stored.
- Login uses a constant-time password-hash comparison.
- Sessions use `HttpOnly` and `SameSite=Lax` cookies and expire after eight hours.
- Set `NODE_ENV=production` when running behind HTTPS to add the cookie `Secure` flag.
