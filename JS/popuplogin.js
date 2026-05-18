document.addEventListener('DOMContentLoaded', () => {
  console.log('[popuplogin] DOM ready');
  const x = document.getElementById('overlay');
  const loginPopup = document.getElementById('loginPopup');
  const signupPopup = document.getElementById('signupPopup');
  const loginBtn = document.getElementById('login1');
  const signupBtn = document.getElementById('login2');
  const logSignContainer = document.querySelector('.log-sign');

  if (!loginBtn || !signupBtn || !logSignContainer) {
    console.error('[popuplogin] Essential elements missing:', {
      loginBtn: !!loginBtn,
      signupBtn: !!signupBtn,
      logSignContainer: !!logSignContainer
    });
    return;
  }

  if (x) {
    x.querySelectorAll('.popup > button:not([type]), .popup > p button:not([type])').forEach((button) => {
      button.type = 'button';
    });
  }

  function openPopup(type) {
    if (x) x.style.display = 'flex';
    if (type === 'login') {
      loginPopup?.classList.add('active');
      signupPopup?.classList.remove('active');
    } else {
      signupPopup?.classList.add('active');
      loginPopup?.classList.remove('active');
    }
  }
  function switchPopup(type) {
    if (type === 'login') {
      signupPopup?.classList.remove('active');
      setTimeout(() => loginPopup?.classList.add('active'), 100);
    } else {
      loginPopup?.classList.remove('active');
      setTimeout(() => signupPopup?.classList.add('active'), 100);
    }
  }
  if (x) {
    x.addEventListener('click', (e) => {
      if (e.target === x) closePopup();
    });
  }
 function setupShowPassword(checkboxId, inputIds) {
    const checkbox = document.getElementById(checkboxId);
    const targets = Array.isArray(inputIds) ? inputIds : [inputIds];
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        targets.forEach((id) => {
          const input = document.getElementById(id);
          if (input) {
            input.type = checkbox.checked ? 'text' : 'password';
          }
        });
      });
    }
  }
  setupShowPassword('showLoginPassword', 'loginPassword');
  setupShowPassword('showSignupPassword', ['signupPassword', 'confirmSignupPassword']);
  function validatePassword(password) {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return pattern.test(password);
  }
  function validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
  return pattern.test(email);
}
  window.openPopup = openPopup;
  window.switchPopup = switchPopup;
  window.closePopup = closePopup;
  const apiURL = '/api/users';
  const signupForm = signupPopup?.querySelector('form');
  const loginForm = loginPopup?.querySelector('form');

  const parseJsonSafe = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {};
    }
    return response.json().catch(() => ({}));
  };

  function resetAuthForms() {
    signupForm?.reset();
    loginForm?.reset();

    const loginPassword = document.getElementById('loginPassword');
    const signupPassword = document.getElementById('signupPassword');
    const confirmSignupPassword = document.getElementById('confirmSignupPassword');
    const showLoginPassword = document.getElementById('showLoginPassword');
    const showSignupPassword = document.getElementById('showSignupPassword');

    if (loginPassword) loginPassword.type = 'password';
    if (signupPassword) signupPassword.type = 'password';
    if (confirmSignupPassword) confirmSignupPassword.type = 'password';
    if (showLoginPassword) showLoginPassword.checked = false;
    if (showSignupPassword) showSignupPassword.checked = false;
  }

  function closePopup() {
    if (x) x.style.display = 'none';
    loginPopup?.classList.remove('active');
    signupPopup?.classList.remove('active');
    resetAuthForms();
  }
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('signupUsername')?.value?.trim() || '';
      const email = document.getElementById('signupEmail')?.value?.trim() || '';
      const password = document.getElementById('signupPassword')?.value?.trim() || '';
      const confirm = document.getElementById('confirmSignupPassword')?.value?.trim() || '';

      if (!username || !email || !password) {
        alert('Please fill all fields.');
        return;
      }
      if (!validatePassword(password)) {
      alert('Password must be at least 8 characters long and include uppercase, lowercase, and a number.');
      return;
      }
      if (!validateEmail(email)) {
      alert('Please enter a valid email address.');
      return;
      }
      if (password !== confirm) {
        alert('Passwords do not match!');
        return;
      }

      try {
        const newUser = { username, email, password };
        const res = await fetch(`${apiURL}/register`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });

        if (!res.ok) {
          const data = await parseJsonSafe(res);
          throw new Error(data.error || 'Signup failed');
        }

        alert('Signup successfull! Please login to continue.');
        switchPopup('login');
      } catch (err) {
        console.error('[popuplogin] signup error', err);
        alert(err.message || 'Signup failed');
      }
    }); 
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value?.trim() || '';
      const password = document.getElementById('loginPassword')?.value?.trim() || '';

      if (!email || !password) {
        alert('Please enter email and password.');
        return;
      }

      try {
        const res = await fetch(`${apiURL}/login`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await parseJsonSafe(res);
        if (res.ok && data.user) {
          sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));
          alert(`Welcome back, ${data.user.username}!`);
          closePopup();
          updateUserUI();
          try { window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: data.user } })) } catch (e) { /* noop */ }
        } else {
          alert(data.error || 'Invalid email or password.');
        }
      } catch (err) {
        console.error('[popuplogin] login error', err);
        alert(err.message || 'Login failed.');
      }
    });
  }
  function updateUserUI() {
    let user = null;
    try {
      user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    } catch (_error) {
      sessionStorage.removeItem('loggedInUser');
    }
    console.log('[popuplogin] updateUserUI user=', user);

    logSignContainer.querySelectorAll('#logoutBtn, #userBox').forEach((node) => node.remove());

    if (user) {
      loginBtn.style.display = 'none';
      signupBtn.style.display = 'none';

      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.textContent = 'Log Out';
      logoutBtn.style.height = '50px';
      logoutBtn.style.width = '100px';
      logoutBtn.style.backgroundColor = 'transparent';
      logoutBtn.style.color = 'white';
      logoutBtn.style.border = '2px solid white';
      logoutBtn.style.fontStyle = 'italic';
      logoutBtn.addEventListener('mouseover', function() {
        logoutBtn.style.color = 'black';
        logoutBtn.style.backgroundColor = 'white';
      })
      logoutBtn.addEventListener('mouseleave', function() {
        logoutBtn.style.color = 'white';
        logoutBtn.style.backgroundColor = 'transparent';
      })
      logoutBtn.addEventListener('click', () => {
        fetch(`${apiURL}/logout`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' }
        })
          .then((res) => {
            if (!res.ok) throw new Error('Server logout failed')
            sessionStorage.removeItem('loggedInUser');
            alert('Logged out successfully.');
            updateUserUI();
            try { window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null } })) } catch (e) { /* noop */ }
          })
          .catch((error) => {
            console.error('[popuplogin] logout error', error);
            alert('Logout failed. Please try again.');
          });
      });
        const userBox = document.createElement('div');
        userBox.id = 'userBox';
        userBox.style.display = 'flex';
        userBox.style.alignItems = 'center';
        userBox.style.gap = '10px';
        userBox.style.margin = '50px 10px';
        const icon = document.createElement('img');
        icon.src = '/MEDIA/avatar-placeholder.svg';
        icon.alt = 'Profile';
        icon.style.width = '35px';
        icon.style.height = '35px';
        icon.style.borderRadius = '50%';

        const name = document.createElement('span');
        name.textContent = user.username;
        name.style.color = 'white';
        name.style.fontSize = '24px';
        name.style.fontWeight = '500';

        userBox.appendChild(icon);
        userBox.appendChild(name);

        logSignContainer.appendChild(userBox);

      logSignContainer.appendChild(logoutBtn);
    } else {
      loginBtn.style.display = 'inline-block';
      signupBtn.style.display = 'inline-block';
      logSignContainer.querySelectorAll('#logoutBtn, #userBox').forEach((node) => node.remove());
    }
  }
  updateUserUI();
  window._updateUserUI = updateUserUI;
});
