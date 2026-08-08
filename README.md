# Lumina authentication app

A small Node.js application with responsive sign-in and registration pages. It supports creating accounts, persistent user storage, password verification, and cookie-based sessions.

## Start the app

No package installation is required; the app uses only Node.js built-in modules.

```powershell
npm start
```

Open [http://localhost:3000](http://localhost:3000) for the login page, or [http://localhost:3000/register.html](http://localhost:3000/register.html) to create an account.

## Create an account

The registration page asks for:

- Username (2–40 characters)
- Email address
- Password (at least 8 characters)

New accounts are saved in `data/users.json`. Passwords are never stored as plain text: they are salted and hashed using PBKDF2-SHA256. Once registration succeeds, the user is signed in automatically.

When that user signs in later, the login page shows their saved username in the welcome message.

## Demo account

For first-time local use, a demo account is created automatically:

- Email: `demo@lumina.local`
- Password: `ChangeMe123!`

To set a different demo password before the first start:

```powershell
$env:DEMO_PASSWORD = 'YourSecurePassword'
npm start
```

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/register` | Creates an account and starts a session. |
| `POST` | `/api/login` | Verifies credentials and starts a session. |
| `GET` | `/api/session` | Returns the currently authenticated user. |
| `POST` | `/api/logout` | Ends the current session. |

## Security notes

- Password hashes use PBKDF2-SHA256 with a unique random salt.
- Password verification uses a constant-time comparison.
- Sessions use `HttpOnly`, `SameSite=Lax` cookies and expire after eight hours.
- `data/users.json` is excluded from Git via `.gitignore`.
- In production, run behind HTTPS and set `NODE_ENV=production`; this adds the cookie's `Secure` flag.
