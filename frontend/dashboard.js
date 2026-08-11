const authApi = 'http://localhost:3000/api/auth';
const taskApi = 'http://localhost:3000/api/tasks';
const taskForm = document.querySelector('#task-form');
const list = document.querySelector('.tasks');
const empty = document.querySelector('.empty');
const count = document.querySelector('#count');
const message = document.querySelector('.message');

async function auth() {
  const response = await fetch(`${authApi}/session`, { credentials: 'include' });
  if (!response.ok) return location.href = '/';
  const data = await response.json();
  document.querySelector('#name').textContent = data.user.name;
}

async function api(url = taskApi, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json();
  if (response.status === 401) { location.href = '/'; throw new Error('Please sign in.'); }
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

function draw(tasks) {
  list.innerHTML = '';
  count.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
  empty.hidden = tasks.length > 0;
  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task ${task.status === 'completed' ? 'done' : ''}`;
    const details = document.createElement('div'); details.className = 'details';
    const title = document.createElement('span'); title.className = 'title'; title.textContent = task.title;
    const deadline = document.createElement('span'); deadline.className = 'meta';
    deadline.textContent = task.deadline ? `Due ${new Date(`${task.deadline}T00:00:00`).toLocaleDateString()}` : 'No deadline';
    details.append(title, deadline);
    const priority = document.createElement('span'); priority.className = `badge ${task.priority}`; priority.textContent = `${task.priority} priority`;
    const status = document.createElement('span'); status.className = `badge ${task.status || 'pending'}`; status.textContent = task.status === 'completed' ? 'Completed' : 'Pending';
    const complete = document.createElement('button'); complete.className = 'complete'; complete.textContent = task.status === 'completed' ? 'Reopen' : 'Complete'; complete.onclick = () => change(task.id, task.status === 'completed' ? 'pending' : 'completed');
    const removeButton = document.createElement('button'); removeButton.className = 'delete'; removeButton.textContent = 'Delete'; removeButton.onclick = () => remove(task.id);
    item.append(details, priority, status, complete, removeButton);
    list.append(item);
  });
}

async function load() { draw((await api()).tasks); }
async function change(id, status) { try { await api(`${taskApi}/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await load(); } catch (error) { message.textContent = error.message; } }
async function remove(id) { try { await api(`${taskApi}/${id}`, { method: 'DELETE' }); await load(); } catch (error) { message.textContent = error.message; } }

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  const submit = taskForm.querySelector('.primary');
  submit.disabled = true;
  try {
    const payload = Object.fromEntries(new FormData(taskForm));
    await api(taskApi, { method: 'POST', body: JSON.stringify(payload) });
    taskForm.reset();
    await load();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});

document.querySelector('#logout').onclick = async () => { await fetch(`${authApi}/logout`, { method: 'POST', credentials: 'include' }); location.href = '/'; };
auth().then(load).catch((error) => { message.textContent = error.message; });
