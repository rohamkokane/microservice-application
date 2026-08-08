const taskForm = document.querySelector('#task-form');
const taskList = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const count = document.querySelector('#task-count');
const message = document.querySelector('#task-message');

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (response.status === 401) { window.location.href = 'index.html'; throw new Error('Please sign in to continue.'); }
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}
function renderTasks(tasks) {
  taskList.innerHTML = '';
  count.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
  emptyState.hidden = tasks.length > 0;
  for (const task of tasks) {
    const item = document.createElement('li');
    item.className = 'task-item';
    const title = document.createElement('span'); title.className = 'task-title'; title.textContent = task.title;
    const priority = document.createElement('span'); priority.className = `priority priority-${task.priority}`; priority.textContent = `${task.priority} priority`;
    const remove = document.createElement('button'); remove.className = 'delete-task'; remove.type = 'button'; remove.textContent = 'Delete'; remove.addEventListener('click', () => deleteTask(task.id));
    item.append(title, priority, remove); taskList.append(item);
  }
}
async function loadTasks() {
  const data = await request('/api/tasks'); renderTasks(data.tasks);
}
async function deleteTask(id) {
  try { await request(`/api/tasks/${id}`, { method: 'DELETE' }); await loadTasks(); } catch (error) { message.textContent = error.message; }
}
taskForm.addEventListener('submit', async (event) => {
  event.preventDefault(); message.textContent = '';
  try {
    await request('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: taskForm.title.value, priority: taskForm.priority.value }) });
    taskForm.reset(); await loadTasks(); taskForm.title.focus();
  } catch (error) { message.textContent = error.message; }
});
document.querySelector('#logout').addEventListener('click', async () => { await fetch('/api/logout', { method: 'POST' }); window.location.href = 'index.html'; });
(async () => { try { const session = await request('/api/session'); document.querySelector('#user-name').textContent = session.user.name; await loadTasks(); } catch (error) { message.textContent = error.message; } })();
