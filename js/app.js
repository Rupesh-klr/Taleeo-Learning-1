/* ═══════════════════════════════════════════════════════
   CENTRAL APP SHELL CONTROLLER
═══════════════════════════════════════════════════════ */
const USE_SERVER = true;
const BACKEND_URL = "http://localhost:3000/api/v1/taleeo_lms";
const MAX_TABS = 15;
var _currentUser = null;

/* ── HELPERS & UTILITIES ── */
function ls(key, val) {
  if (val !== undefined) { localStorage.setItem('tlms_' + key, JSON.stringify(val)); return val; }
  try { return JSON.parse(localStorage.getItem('tlms_' + key)); } catch (e) { return null; }
}

function showToast(msg, icon) {
  var t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.querySelector('.toast-icon').textContent = (icon || '✅') + ' ';
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3500);
}

function showLoading() {
  document.getElementById('main-content').innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;height:100%;color:var(--v2);">
      <div style="font-size:1.2rem;font-weight:600;">Loading data...</div>
    </div>`;
}

// Fixed missing global functions (from previous response)
window.openEditModuleModal = function(moduleId) {
    if(typeof curriculum !== 'undefined') {
        curriculum.openEditModuleModal(moduleId);
    } else {
        showToast("Editor not loaded.", "❌");
    }
}

/* ── TAB HISTORY & NAVIGATION SAVER ── */
function initTabSession() {
    let tabId = sessionStorage.getItem('lms_tab_id');
    if (!tabId) {
        tabId = 'tab_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        sessionStorage.setItem('lms_tab_id', tabId);
    }
    let tabHistory = ls('tab_history') || {};
    tabHistory[tabId] = {
        lastActive: Date.now(),
        lastPage: tabHistory[tabId]?.lastPage || null,
        lastArgs: tabHistory[tabId]?.lastArgs || null
    };
    let entries = Object.entries(tabHistory);
    if (entries.length > MAX_TABS) {
        entries.sort((a, b) => b[1].lastActive - a[1].lastActive);
        tabHistory = Object.fromEntries(entries.slice(0, MAX_TABS));
    }
    ls('tab_history', tabHistory);
    return tabId;
}

function saveNavState(pageId, args = null) {
    const tabId = sessionStorage.getItem('lms_tab_id');
    let tabHistory = ls('tab_history') || {};
    if (tabId && tabHistory[tabId]) {
        tabHistory[tabId].lastPage = pageId;
        tabHistory[tabId].lastArgs = args;
        tabHistory[tabId].lastActive = Date.now();
        ls('tab_history', tabHistory);
    }
}

/* ── RBAC SIDEBAR BUILDER ── */
function buildSidebarShell() {
    var u = _currentUser;
    document.getElementById('sb-name').textContent = u.name;
    document.getElementById('sb-role').textContent = u.role.charAt(0).toUpperCase() + u.role.slice(1);
    var isAdminType = ['admin', 'superadmin', 'staff'].includes(u.role);
    document.getElementById('sb-role-badge').textContent = isAdminType ? 'Staff Panel' : 'Student Portal';
    document.getElementById('sb-avatar').textContent = u.name[0].toUpperCase();
    document.getElementById('sb-avatar').style.background = isAdminType ? 'var(--linear-admin)' : 'var(--linear-v)';

    var allowedModules = FRONTEND_MODULES[u.role] || FRONTEND_MODULES['student'];
    var nav = document.getElementById('sidebar-nav');
    var navHTML = '';
    var currentSection = '';

    allowedModules.forEach(function(mod) {
        if (mod.section && mod.section !== currentSection) {
            navHTML += `<div class="sb-section">${mod.section}</div>`;
            currentSection = mod.section;
        }
        // Updated: Navigation now uses URL hash
        navHTML += `<a href="#${mod.id}" class="sb-item" id="nav-${mod.id}"><span class="sb-item-icon">${mod.icon}</span>${mod.label}</a>`;
    });
    nav.innerHTML = navHTML;
}

/* ── JQUERY HASH ROUTER ── */
// Canonical jQuery pattern to manage page loading without reloads
function handleHashRouter() {
    let hash = window.location.hash.substring(1); // Remove '#'

    // If no hash (fresh load), determine default page by role
    if (!hash) {
        if (!_currentUser) return redirectToLogin();
        hash = ROUTES["default"][_currentUser.role] || "login";
        window.location.hash = hash; // Redirect to default
        return;
    }

    // Special case for login/signup reloads (if already logged in)
    if ((hash === 'login' || hash === 'signup') && _currentUser) {
        redirectToDefaultPage();
        return;
    }

    // Find the correct template path from ROUTES mapping
    const templatePath = ROUTES[hash];

    if (!templatePath) {
        // Simple 404 handler
        document.getElementById('main-content').innerHTML = `
            <div style="padding:40px;text-align:center;color:var(--muted);">
                <h2>404 — Section Not Found</h2>
                <a href="#">Go back to Dashboard</a>
            </div>`;
        return;
    }

    // Use jQuery .load() to fetch and insert the HTML block
    showLoading();
    
    // canonical jQuery template loader
    $( "#main-content" ).load( templatePath + " .module-container", function( response, status, xhr ) {
        if ( status == "error" ) {
          $( "#main-content" ).html( "<p>Failed to load " + templatePath + "</p>" );
          return;
        }
        
        // --- 1. Update Sidebar Active State ---
        document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
        const activeNav = document.getElementById('nav-' + hash);
        if (activeNav) activeNav.classList.add('active');
        
        // --- 2. Save Navigation State ---
        saveNavState(hash, null); // Clear args by default
        
        // --- 3. Call specific module initialization ---
        // This is where module-specific rendering happens
        initializeModule(hash);
    });
}
function initializeModule(hash) {
    if (hash === 'login' || hash === 'signup') return;
    
    switch(hash) {
        case 'admin-dashboard':
        case 'student-dashboard': dashboard.init(); break;
        case 'admin-curriculum':
        case 'student-course': curriculum.init(hash); break;
        case 'admin-batches': batches.init(); break;
        case 'admin-recordings':
        case 'student-recordings': recordings.init(); break;
        case 'admin-attendance':
        case 'student-attendance': attendance.init(); break;
    }
}
/* ── AUTH HELPERS ── */
function redirectToLogin() {
    const loginContainer = document.getElementById('login-page');
    const appShell = document.getElementById('app-shell');
    
    if (loginContainer && appShell) {
        appShell.style.display = 'none';
        loginContainer.style.display = 'block';
        
        // Use jQuery to load the modular login page into the container
        $("#login-page").load("pages/login.html", function() {
            console.log("Login module loaded dynamically.");
        });
    }
    window.location.hash = 'login';
}
function redirectToDefaultPage() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-shell').style.display = 'block';
    const defaultPage = ROUTES["default"][_currentUser.role];
    window.location.hash = defaultPage;
}

// Centralized Session Check
async function checkGlobalSession() {
    var savedUser = ls('session_user');
    if (!savedUser) return redirectToLogin();

    _currentUser = savedUser; // Optimistic load
    
    // Check if we can reach the server to verify the session cookie
    if (USE_SERVER) {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/me`, { credentials: 'include' });
        if (response.ok) {
          const result = await response.json();
          _currentUser = result.user; // Update with backend state
          ls('session_user', result.user);
          onSessionVerified();
        } else {
          auth.doLogout(); // Kick to login if unauthorized
        }
      } catch (err) {
        onSessionVerified(); // Fallback to local data
      }
    } else {
      onSessionVerified(); // Fallback to local data
    }
}

function onSessionVerified() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-shell').style.display = 'block';
    buildSidebarShell();
    
    // Now that shell is built, enable routing
    $(window).on('hashchange', handleHashRouter);
    handleHashRouter(); // Run once for current hash
}

/* ── RBAC Config ── */
const FRONTEND_MODULES = {
  "admin": [
    { id: 'admin-dashboard', icon: '📊', label: 'Dashboard', section: 'Overview' },
    { id: 'admin-curriculum', icon: '📚', label: 'Course Curriculum', section: 'Overview' }, // The combined view
    { id: 'admin-batches', icon: '🗂️', label: 'Batches', section: 'Management' },
    { id: 'admin-students', icon: '👥', label: 'Students', section: 'Management' },
    { id: 'admin-recordings', icon: '🎥', label: 'Recordings', section: 'Management' },
    { id: 'admin-attendance', icon: '✅', label: 'Attendance', section: 'Tools' },
  ],
  "student": [
    { id: 'student-dashboard', icon: '🏠', label: 'Dashboard', section: 'My Learning' },
    { id: 'student-course', icon: '📚', label: 'Curriculum', section: 'My Learning' },
    { id: 'student-recordings', icon: '🎥', label: 'Recordings', section: 'My Learning' },
    { id: 'student-attendance', icon: '✅', label: 'My Attendance', section: 'Academics' },
  ]
};

/* ── CANONICAL JQUERY INIT ── */
$(document).ready(function() {
    initTabSession();
    // Delay checkSession slightly to let the initial splash screen show if needed
    setTimeout(checkGlobalSession, 100); 
});