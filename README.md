# Lumina login app

## Run

```powershell
npm start
```

Visit `http://localhost:3000`.

## Demo account

- Email: `demo@lumina.local`
- Password: `ChangeMe123!`

On the first start, the server creates `data/users.json` with a PBKDF2-SHA256 password hash. The file is ignored by Git. To choose another initial password, set `DEMO_PASSWORD` before the first start.

The backend authenticates credentials, uses constant-time hash comparison, and returns an `HttpOnly`, `SameSite=Lax` session cookie. Set `NODE_ENV=production` behind HTTPS to mark the cookie as `Secure`.

## Registration

Visit `http://localhost:3000/register.html` to create an account. New usernames, email addresses, and password hashes are stored in `data/users.json`. A successful registration signs the user in automatically; later logins display their saved username.
