const form = document.querySelector('#login-form');
const password = document.querySelector('#password');
const toggle = document.querySelector('.toggle-password');
const message = document.querySelector('#form-message');
const submit = document.querySelector('.submit-button');

toggle.addEventListener('click', () => {
  const show = password.type === 'password';
  password.type = show ? 'text' : 'password';
  toggle.textContent = show ? 'Hide' : 'Show';
  toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.className = 'form-message';
  if (!form.checkValidity()) return form.reportValidity();
  submit.disabled = true;
  submit.textContent = 'Signing in…';
  try {
    const response = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.value.trim(), password: password.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    message.textContent = result.message;
    message.classList.add('success');
    window.setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
  } catch (error) {
    message.textContent = error.message || 'Unable to sign in. Please try again.';
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Sign in <span>→</span>';
  }
});
