/* ── Auth pages: login.html & register.html ────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (isLoggedIn()) {
    const redirect = new URLSearchParams(location.search).get('redirect') || 'index.html';
    location.href = redirect;
    return;
  }

  /* ── LOGIN ── */
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn   = loginForm.querySelector('button[type=submit]');
      const email = loginForm.email.value.trim();
      const pass  = loginForm.password.value;

      if (!email || !pass) { showToast('Please fill all fields', 'error'); return; }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Signing in…';

      try {
        const data = await apiFetch('/users/login', {
          method: 'POST',
          body: JSON.stringify({ email, password: pass })
        });
        setAuth(data);
        showToast(`Welcome back, ${data.name}!`, 'success');

        const redirect = new URLSearchParams(location.search).get('redirect') || 'index.html';
        setTimeout(() => location.href = redirect, 800);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }

  /* ── REGISTER ── */
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn     = registerForm.querySelector('button[type=submit]');
      const name    = registerForm.fullname.value.trim();
      const email   = registerForm.email.value.trim();
      const pass    = registerForm.password.value;
      const confirm = registerForm.confirm.value;

      if (!name || !email || !pass || !confirm) {
        showToast('Please fill all fields', 'error'); return;
      }
      if (pass.length < 6) {
        showToast('Password must be at least 6 characters', 'error'); return;
      }
      if (pass !== confirm) {
        showToast('Passwords do not match', 'error'); return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Creating account…';

      try {
        const data = await apiFetch('/users/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password: pass })
        });
        setAuth(data);
        showToast(`Account created! Welcome, ${data.name}!`, 'success');
        setTimeout(() => location.href = 'index.html', 900);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }
});
