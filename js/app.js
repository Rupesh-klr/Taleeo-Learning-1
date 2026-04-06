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
    if (!u) return;

    // Use safe selection to prevent null pointer errors
    const nameEl = document.getElementById('sb-name');
    const roleEl = document.getElementById('sb-role');
    const badgeEl = document.getElementById('sb-role-badge');
    const avatarEl = document.getElementById('sb-avatar');
    const navContainer = document.getElementById('sidebar-nav');

    if (nameEl) nameEl.textContent = u.name;
    if (roleEl) roleEl.textContent = u.role.charAt(0).toUpperCase() + u.role.slice(1);
    
    var isAdminType = ['admin', 'superadmin', 'staff'].includes(u.role);
    if (badgeEl) badgeEl.textContent = isAdminType ? 'Staff Panel' : 'Student Portal';
    
    if (avatarEl) {
        avatarEl.textContent = u.name[0].toUpperCase();
        avatarEl.style.background = isAdminType ? 'var(--linear-admin)' : 'var(--linear-v)';
    }

    // Fixed Navigation logic to replace missing renderNavigationLinks
    if (navContainer) {
        const allowedModules = FRONTEND_MODULES[u.role] || FRONTEND_MODULES['student'];
        let navHTML = '';
        let currentSection = '';

        allowedModules.forEach(mod => {
            if (mod.section && mod.section !== currentSection) {
                navHTML += `<div class="sb-section">${mod.section}</div>`;
                currentSection = mod.section;
            }
            navHTML += `
                <a href="#${mod.id}" class="sb-item" id="nav-${mod.id}">
                    <span class="sb-item-icon">${mod.icon}</span>${mod.label}
                </a>`;
        });
        navContainer.innerHTML = navHTML;
    }
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
    
    // Dynamically call module init based on the hash
    if (hash === 'admin-curriculum' || hash === 'student-course') {
        if (typeof curriculum !== 'undefined') {
            curriculum.init(hash);
        }
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

    _currentUser = savedUser; 
    
    if (USE_SERVER) {
        // Use your new helper which includes credentials
        const data = await apiGet('/auth/me'); 
        if (data && data.user) {
            _currentUser = data.user;
            ls('session_user', data.user);
            onSessionVerified(); // This switches the UI from login to app
        } else {
            redirectToLogin();
        }
    } else {
        onSessionVerified();
    }
}
// js/app.js
function onSessionVerified() {
    // 1. Show the shell FIRST
    $('#login-page').hide();
    $('#app-shell').show();
    
    // 2. Build UI after visibility is set
    setTimeout(() => {
        buildSidebarShell();
        $(window).on('hashchange', handleHashRouter);
        handleHashRouter(); 
    }, 50); // Small delay allows DOM to recognize visible elements
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
// js/app.js
function completeLogin(user) {
    _currentUser = user;
    ls('session_user', user); // Store in tlms_session_user

    // Switch Visibility
    $('#login-page').hide();
    $('#app-shell').show();
    
    buildSidebarShell();
    
    // REDIRECT based on role
    const defaultPage = ROUTES["default"][user.role] || "admin-dashboard";
    window.location.hash = defaultPage; // This triggers handleHashRouter
    
    showToast('Welcome back, ' + user.name + '! 👋', '✅');
}
// js/app.js
function buildSidebarShell() {
    var u = _currentUser;
    if (!u) return;

    // Use safe selection to prevent null errors
    const nameEl = document.getElementById('sb-name');
    const roleEl = document.getElementById('sb-role');
    const badgeEl = document.getElementById('sb-role-badge');
    const avatarEl = document.getElementById('sb-avatar');

    if (nameEl) nameEl.textContent = u.name;
    if (roleEl) roleEl.textContent = u.role.charAt(0).toUpperCase() + u.role.slice(1);
    
    var isAdminType = ['admin', 'superadmin', 'staff'].includes(u.role);
    if (badgeEl) badgeEl.textContent = isAdminType ? 'Staff Panel' : 'Student Portal';
    
    if (avatarEl) {
        avatarEl.textContent = u.name[0].toUpperCase();
        avatarEl.style.background = isAdminType ? 'var(--linear-admin)' : 'var(--linear-v)';
    }

    renderNavigationLinks(u.role);
}
/* ═══════════════════════════════════════════════════════
   GLOBAL DATA FETCHERS (Centralized in app.js)
═══════════════════════════════════════════════════════ */

// Global GET Helper
// Global GET Helper
async function apiGet(endpoint) {
    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'GET',
            credentials: 'include', // CRITICAL: This fixed the 401 error
            headers: { 'Content-Type': 'application/json' }
        });

       
        if (response.status === 401) {
            console.warn("Session expired (401). Attempting logout...");
            // Safe call to auth module
            if (window.auth && typeof window.auth.doLogout === 'function') {
                window.auth.doLogout();
            } else {
                // Manual fallback if auth module isn't ready
                localStorage.removeItem('tlms_session_user');
                window.location.hash = 'login';
            }
            return null;
        }

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("API Get Error:", error);
        throw error;
    }
}

// Update your fetchApiData to use the new helper
async function fetchApiData(endpoint, fallbackFunction) {
    if (USE_SERVER) {
        try {
            return await apiGet(endpoint); 
        } catch (err) {
            return fallbackFunction(); 
        }
    }
    return fallbackFunction();
}
// Global POST/PUT Helper
async function apiWrite(endpoint, method = 'POST', payload = {}) {
    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: method,
            credentials: 'include', // CRITICAL: Sends session info
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.status === 401) {
            auth.doLogout();
            throw new Error("Unauthorized access.");
        }

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Save Failed");
        }

        return await response.json();
    } catch (error) {
        console.error(`${method} Error [${endpoint}]:`, error);
        throw error;
    }
}
