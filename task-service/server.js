const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const port = process.env.PORT || 3002;
const authUrl = new URL(process.env.AUTH_SERVICE_URL || 'http://localhost:3001');
const tasksFile = path.join(__dirname, 'data', 'tasks.json');
const allowedOrigin = process.env.WEB_ORIGIN || 'http://localhost:3001';
function tasks() { return fs.existsSync(tasksFile) ? JSON.parse(fs.readFileSync(tasksFile, 'utf8')) : []; }
function saveTasks(value) { fs.mkdirSync(path.dirname(tasksFile), { recursive: true }); fs.writeFileSync(tasksFile, JSON.stringify(value, null, 2), { mode: 0o600 }); }
function json(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Credentials': 'true' }); res.end(JSON.stringify(body)); }
function body(req) { return new Promise((resolve, reject) => { let value = ''; req.on('data', (chunk) => { value += chunk; if (value.length > 10_000) reject(new Error('Request too large')); }); req.on('end', () => { try { resolve(JSON.parse(value || '{}')); } catch { reject(new Error('Invalid JSON')); } }); req.on('error', reject); }); }
function authenticatedUser(req) { return new Promise((resolve, reject) => { const request = http.request({ hostname: authUrl.hostname, port: authUrl.port || 80, path: '/api/session', headers: { Cookie: req.headers.cookie || '' } }, (response) => { let text = ''; response.on('data', (chunk) => { text += chunk; }); response.on('end', () => { if (response.statusCode !== 200) return resolve(null); try { resolve(JSON.parse(text).user); } catch { reject(new Error('Invalid authentication response')); } }); }); request.on('error', reject); request.end(); }); }
function validDeadline(date) { if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false; const parsed = new Date(`${date}T00:00:00Z`); return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date; }

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end(); }
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  let user; try { user = await authenticatedUser(req); } catch { return json(res, 503, { message: 'Authentication service is unavailable.' }); }
  if (!user) return json(res, 401, { message: 'Please sign in to continue.' });
  if (req.method === 'GET' && pathname === '/api/tasks') { const order = { high: 0, medium: 1, low: 2 }; return json(res, 200, { tasks: tasks().filter((task) => task.userId === user.id).sort((a, b) => order[a.priority] - order[b.priority] || b.createdAt.localeCompare(a.createdAt)) }); }
  if (req.method === 'POST' && pathname === '/api/tasks') {
    try { const { title, priority, deadline } = await body(req); const cleanTitle = typeof title === 'string' ? title.trim() : ''; if (!cleanTitle || cleanTitle.length > 140) return json(res, 400, { message: 'Task title must be between 1 and 140 characters.' }); if (!['low', 'medium', 'high'].includes(priority)) return json(res, 400, { message: 'Choose a valid priority.' }); if (deadline && (typeof deadline !== 'string' || !validDeadline(deadline))) return json(res, 400, { message: 'Choose a valid deadline date.' }); const all = tasks(); const task = { id: crypto.randomUUID(), userId: user.id, title: cleanTitle, priority, deadline: deadline || null, status: 'pending', createdAt: new Date().toISOString() }; all.push(task); saveTasks(all); return json(res, 201, { task }); } catch { return json(res, 400, { message: 'Invalid request.' }); }
  }
  if (/^\/api\/tasks\/[^/]+$/.test(pathname)) {
    const id = pathname.split('/').pop(); const all = tasks(); const task = all.find((item) => item.id === id && item.userId === user.id); if (!task) return json(res, 404, { message: 'Task not found.' });
    if (req.method === 'DELETE') { saveTasks(all.filter((item) => item.id !== id)); return json(res, 200, { message: 'Task deleted.' }); }
    if (req.method === 'PATCH') { try { const { status } = await body(req); if (!['pending', 'completed'].includes(status)) return json(res, 400, { message: 'Choose a valid task status.' }); task.status = status; task.completedAt = status === 'completed' ? new Date().toISOString() : null; saveTasks(all); return json(res, 200, { task }); } catch { return json(res, 400, { message: 'Invalid request.' }); } }
  }
  json(res, 405, { message: 'Method not allowed.' });
}).listen(port, () => console.log(`Task service listening on http://localhost:${port}`));
