const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const publicDir = path.join(__dirname, 'public');
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const tasksFile = path.join(dataDir, 'tasks.json');
const port = process.env.PORT || 3000;
const sessions = new Map();
const sessionLifetimeMs = 1000 * 60 * 60 * 8;
const isProduction = process.env.NODE_ENV === 'production';
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex') };
}
function readUsers() {
  if (!fs.existsSync(usersFile)) {
    fs.mkdirSync(dataDir, { recursive: true });
    const password = process.env.DEMO_PASSWORD || 'ChangeMe123!';
    const user = { id: crypto.randomUUID(), name: 'Demo User', email: 'demo@lumina.local', ...hashPassword(password) };
    fs.writeFileSync(usersFile, JSON.stringify([user], null, 2), { mode: 0o600 });
    console.log('Created demo user: demo@lumina.local');
    if (!process.env.DEMO_PASSWORD) console.log('Demo password: ChangeMe123! (set DEMO_PASSWORD before first start to change it)');
    return [user];
  }
  return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}
function saveUsers(users) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), { mode: 0o600 });
}
function readTasks() {
  return fs.existsSync(tasksFile) ? JSON.parse(fs.readFileSync(tasksFile, 'utf8')) : [];
}
function saveTasks(tasks) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2), { mode: 0o600 });
}
function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((entry) => {
    const index = entry.indexOf('='); return [entry.slice(0, index).trim(), decodeURIComponent(entry.slice(index + 1))];
  }));
}
function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }); res.end(JSON.stringify(payload));
}
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 10_000) reject(new Error('Request too large')); });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex'); sessions.set(token, { userId, expiresAt: Date.now() + sessionLifetimeMs }); return token;
}
function getSession(req) {
  const token = parseCookies(req).session; const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) { if (token) sessions.delete(token); return null; }
  return { token, ...session };
}
function requireUser(req, res) {
  const session = getSession(req);
  const user = session && readUsers().find((item) => item.id === session.userId);
  if (!user) { sendJson(res, 401, { message: 'Please sign in to continue.' }); return null; }
  return user;
}
function sessionCookie(token, maxAge = sessionLifetimeMs / 1000) {
  return `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${isProduction ? '; Secure' : ''}`;
}
function sendFile(res, fileName) {
  const filePath = path.resolve(publicDir, fileName === '/' ? 'index.html' : `.${fileName}`);
  if (!filePath.startsWith(publicDir + path.sep) && filePath !== path.join(publicDir, 'index.html')) return res.writeHead(403).end('Forbidden');
  fs.readFile(filePath, (error, data) => {
    if (error) return res.writeHead(404).end('Not found');
    res.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'text/plain; charset=utf-8' }); res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (req.method === 'GET' && pathname === '/api/tasks') {
    const user = requireUser(req, res);
    if (!user) return;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const tasks = readTasks().filter((task) => task.userId === user.id).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.createdAt.localeCompare(a.createdAt));
    return sendJson(res, 200, { tasks });
  }
  if (req.method === 'POST' && pathname === '/api/tasks') {
    const user = requireUser(req, res);
    if (!user) return;
    try {
      const { title, priority } = await getBody(req);
      const cleanTitle = typeof title === 'string' ? title.trim() : '';
      if (!cleanTitle || cleanTitle.length > 140) return sendJson(res, 400, { message: 'Task title must be between 1 and 140 characters.' });
      if (!['low', 'medium', 'high'].includes(priority)) return sendJson(res, 400, { message: 'Choose a valid priority.' });
      const tasks = readTasks();
      const task = { id: crypto.randomUUID(), userId: user.id, title: cleanTitle, priority, createdAt: new Date().toISOString() };
      tasks.push(task); saveTasks(tasks);
      return sendJson(res, 201, { task });
    } catch { return sendJson(res, 400, { message: 'Invalid request.' }); }
  }
  if (req.method === 'DELETE' && /^\/api\/tasks\/[^/]+$/.test(pathname)) {
    const user = requireUser(req, res);
    if (!user) return;
    const taskId = pathname.split('/').pop();
    const tasks = readTasks();
    const task = tasks.find((item) => item.id === taskId && item.userId === user.id);
    if (!task) return sendJson(res, 404, { message: 'Task not found.' });
    saveTasks(tasks.filter((item) => item.id !== taskId));
    return sendJson(res, 200, { message: 'Task deleted.' });
  }
  if (req.method === 'POST' && pathname === '/api/register') {
    try {
      const { username, email, password } = await getBody(req);
      const cleanName = typeof username === 'string' ? username.trim().replace(/\s+/g, ' ') : '';
      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (cleanName.length < 2 || cleanName.length > 40) return sendJson(res, 400, { message: 'Username must be between 2 and 40 characters.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return sendJson(res, 400, { message: 'Enter a valid email address.' });
      if (typeof password !== 'string' || password.length < 8) return sendJson(res, 400, { message: 'Password must be at least 8 characters.' });
      const users = readUsers();
      if (users.some((item) => item.email === cleanEmail)) return sendJson(res, 409, { message: 'An account with this email already exists.' });
      const user = { id: crypto.randomUUID(), name: cleanName, email: cleanEmail, ...hashPassword(password) };
      users.push(user);
      saveUsers(users);
      const token = createSession(user.id);
      return sendJson(res, 201, { message: `Welcome, ${user.name}! Your account is ready.`, user: { name: user.name, email: user.email } }, { 'Set-Cookie': sessionCookie(token) });
    } catch (error) { return sendJson(res, 400, { message: error.message === 'Request too large' ? error.message : 'Invalid request.' }); }
  }
  if (req.method === 'POST' && pathname === '/api/login') {
    try {
      const { email, password } = await getBody(req);
      if (typeof email !== 'string' || typeof password !== 'string') return sendJson(res, 400, { message: 'Email and password are required.' });
      const user = readUsers().find((item) => item.email === email.trim().toLowerCase());
      const valid = user && crypto.timingSafeEqual(Buffer.from(user.hash, 'hex'), Buffer.from(hashPassword(password, user.salt).hash, 'hex'));
      if (!valid) return sendJson(res, 401, { message: 'Invalid email or password.' });
      const token = createSession(user.id);
      return sendJson(res, 200, { message: `Welcome back, ${user.name}!`, user: { name: user.name, email: user.email } }, { 'Set-Cookie': sessionCookie(token) });
    } catch (error) { return sendJson(res, 400, { message: error.message === 'Request too large' ? error.message : 'Invalid request.' }); }
  }
  if (req.method === 'GET' && pathname === '/api/session') {
    const session = getSession(req); const user = session && readUsers().find((item) => item.id === session.userId);
    return user ? sendJson(res, 200, { authenticated: true, user: { name: user.name, email: user.email } }) : sendJson(res, 401, { authenticated: false });
  }
  if (req.method === 'POST' && pathname === '/api/logout') {
    const session = getSession(req); if (session) sessions.delete(session.token);
    return sendJson(res, 200, { message: 'Signed out.' }, { 'Set-Cookie': sessionCookie('', 0) });
  }
  if (req.method === 'GET') return sendFile(res, pathname);
  res.writeHead(405).end('Method not allowed');
});
setInterval(() => { for (const [token, session] of sessions) if (session.expiresAt < Date.now()) sessions.delete(token); }, 60 * 60 * 1000).unref();
server.listen(port, () => console.log(`Login app is running at http://localhost:${port}`));
