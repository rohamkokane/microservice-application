const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

const port = process.env.PORT || 4001;

const usersFile = __dirname + '/data/users.json';

const sessions = new Map();
const ttl = 1000 * 60 * 60 * 8;
const production = process.env.NODE_ENV === 'production';

function hash(password, salt = crypto.randomBytes(16).toString('hex')) {
  return {
    salt,
    hash: crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex')
  };
}

function users() {
  return fs.existsSync(usersFile)
    ? JSON.parse(fs.readFileSync(usersFile, 'utf8'))
    : [];
}

function saveUsers(value) {
  fs.mkdirSync(__dirname + '/data', { recursive: true });
  fs.writeFileSync(
    usersFile,
    JSON.stringify(value, null, 2),
    { mode: 0o600 }
  );
}

function cookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf('=');
        return [
          part.slice(0, i).trim(),
          decodeURIComponent(part.slice(i + 1))
        ];
      })
  );
}

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });

  res.end(JSON.stringify(body));
}

function body(req) {
  return new Promise((resolve, reject) => {
    let value = '';

    req.on('data', (chunk) => {
      value += chunk;

      if (value.length > 10000) {
        reject(new Error('Request too large'));
      }
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(value || '{}'));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', reject);
  });
}

function session(req) {
  const token = cookies(req).lumina_session;
  const value = token && sessions.get(token);

  if (!value || value.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }

  return { token, ...value };
}

function startSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');

  sessions.set(token, {
    userId,
    expiresAt: Date.now() + ttl
  });

  return token;
}

function sessionCookie(token, maxAge = ttl / 1000) {
  return `lumina_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${production ? '; Secure' : ''}`;
}

function currentUser(req) {
  const active = session(req);

  return active && users().find(
    (user) => user.id === active.userId
  );
}

http.createServer(async (req, res) => {

  const pathname = new URL(
    req.url,
    `http://${req.headers.host}`
  ).pathname;

  // REGISTER
  if (req.method === 'POST' && pathname === '/api/register') {
    try {
      const { username, email, password } = await body(req);

      const name =
        typeof username === 'string'
          ? username.trim().replace(/\s+/g, ' ')
          : '';

      const cleanEmail =
        typeof email === 'string'
          ? email.trim().toLowerCase()
          : '';

      if (name.length < 2 || name.length > 40) {
        return json(res, 400, {
          message: 'Username must be between 2 and 40 characters.'
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return json(res, 400, {
          message: 'Enter a valid email address.'
        });
      }

      if (typeof password !== 'string' || password.length < 8) {
        return json(res, 400, {
          message: 'Password must be at least 8 characters.'
        });
      }

      const all = users();

      if (all.some((user) => user.email === cleanEmail)) {
        return json(res, 409, {
          message: 'An account with this email already exists.'
        });
      }

      const user = {
        id: crypto.randomUUID(),
        name,
        email: cleanEmail,
        ...hash(password)
      };

      all.push(user);
      saveUsers(all);

      return json(
        res,
        201,
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        },
        {
          'Set-Cookie': sessionCookie(startSession(user.id))
        }
      );

    } catch (error) {
      return json(res, 400, {
        message:
          error.message === 'Request too large'
            ? error.message
            : 'Invalid request.'
      });
    }
  }

  // LOGIN
  if (req.method === 'POST' && pathname === '/api/login') {
    try {
      const { email, password } = await body(req);

      const user =
        typeof email === 'string' &&
        users().find(
          (item) => item.email === email.trim().toLowerCase()
        );

      const valid =
        user &&
        typeof password === 'string' &&
        crypto.timingSafeEqual(
          Buffer.from(user.hash, 'hex'),
          Buffer.from(hash(password, user.salt).hash, 'hex')
        );

      if (!valid) {
        return json(res, 401, {
          message: 'Invalid email or password.'
        });
      }

      return json(
        res,
        200,
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        },
        {
          'Set-Cookie': sessionCookie(startSession(user.id))
        }
      );

    } catch {
      return json(res, 400, {
        message: 'Invalid request.'
      });
    }
  }

  // SESSION
  if (req.method === 'GET' && pathname === '/api/session') {
    const user = currentUser(req);

    return user
      ? json(res, 200, {
          authenticated: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        })
      : json(res, 401, {
          authenticated: false
        });
  }

  // LOGOUT
  if (req.method === 'POST' && pathname === '/api/logout') {
    const active = session(req);

    if (active) {
      sessions.delete(active.token);
    }

    return json(
      res,
      200,
      {
        message: 'Signed out.'
      },
      {
        'Set-Cookie': sessionCookie('', 0)
      }
    );
  }

  // Any other request
  res.writeHead(405);
  res.end();

}).listen(port, () => {
  console.log(`Auth service listening on http://localhost:${port}`);
});