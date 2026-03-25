const API_BASE = '/api';

const Auth = {
  save(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isCustomer() {
    const u = this.getUser();
    return u && u.role === 'CUSTOMER';
  },

  isAgency() {
    const u = this.getUser();
    return u && u.role === 'AGENCY';
  },
};


async function apiFetch(path, options = {}) {
  const token = Auth.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return { ok: response.ok, status: response.status, data };
}


function renderNavbar(activePage = '') {
  const user      = Auth.getUser();
  const isLoggedIn = Auth.isLoggedIn();
  const isAgency   = Auth.isAgency();
  const isCustomer = Auth.isCustomer();

  const carIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 17H3a2 2 0 01-2-2v-4l2.5-6h13L19 11v4a2 2 0 01-2 2h-2"/>
      <circle cx="7.5" cy="17.5" r="2.5"/>
      <circle cx="14.5" cy="17.5" r="2.5"/>
    </svg>`;

  // Build nav links based on role
  let links = `<li><a href="index.html" class="${activePage === 'cars' ? 'active' : ''}">Browse Cars</a></li>`;

  if (isAgency) {
    links += `<li><a href="add-car.html" class="${activePage === 'add-car' ? 'active' : ''}">Add Car</a></li>`;
    links += `<li><a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">My Dashboard</a></li>`;
  }

  // Right side
  let rightSide = '';
  if (isLoggedIn) {
    const badgeClass = isAgency ? 'agency' : 'customer';
    const badgeLabel = isAgency ? 'Agency'  : 'Customer';
    rightSide = `
      <div class="nav-user">
        <span class="nav-user-badge ${badgeClass}">${badgeLabel}</span>
        <span style="font-size:0.875rem;color:var(--text-secondary)">${user.name}</span>
        <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Logout</button>
      </div>`;
  } else {
    rightSide = `
      <div class="nav-user">
        <a href="login.html"    class="btn btn-secondary btn-sm">Login</a>
        <a href="register.html" class="btn btn-primary   btn-sm">Register</a>
      </div>`;
  }

  const navHTML = `
    <nav class="navbar">
      <a href="index.html" class="navbar-brand">
        ${carIcon}
        Drive<span>Ease</span>
      </a>
      <ul class="nav-links">${links}</ul>
      ${rightSide}
    </nav>`;

 
  const target = document.getElementById('navbar');
  if (target) {
    target.innerHTML = navHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }
}

function handleLogout() {
  Auth.logout();
  window.location.href = 'index.html';
}


function showAlert(elId, message, type = 'error') {
  const el = document.getElementById(elId);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = message;
}


function hideAlert(elId) {
  const el = document.getElementById(elId);
  if (el) el.className = 'alert';
}

function setLoading(btnId, loading, defaultText = 'Submit') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner"></span> Please wait…`
    : defaultText;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
  return '₹' + parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}
