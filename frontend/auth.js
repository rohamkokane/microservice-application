const gateway = '/api/auth';
const form = document.querySelector('form');
const message = document.querySelector('.message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('button');
  button.disabled = true;
  message.className = 'message';
  try {
    const endpoint = form.id === 'register' ? '/register' : '/login';
    const response = await fetch(gateway + endpoint, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    message.textContent = `Welcome, ${data.user.name}!`;
    message.classList.add('ok');
    setTimeout(() => { location.href = 'dashboard.html'; }, 400);
  } catch (error) { message.textContent = error.message; } finally { button.disabled = false; }
});
