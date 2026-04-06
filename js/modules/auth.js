/* ═══════════════════════════════════════════════════════
   AUTH MODULE
═══════════════════════════════════════════════════════ */
// js/modules/auth.js
if (typeof auth === 'undefined') {
    var auth = {
        _loginPending: null,

        // Ensure doLogout is explicitly defined as a function
        doLogout: async function() {
            console.log("🚪 Logging out...");
            if (USE_SERVER) {
                try {
                    // Call backend to clear httpOnly cookies
                    await fetch(`${BACKEND_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
                } catch (e) { console.error("Logout API failed", e); }
            }
            _currentUser = null;
            // Use the ls helper to clear the session
            localStorage.removeItem('tlms_session_user');
            // Clear all local identifiers
            localStorage.removeItem('tlms_session_user');
            localStorage.removeItem('tlms_tab_history');
            sessionStorage.removeItem('lms_tab_id');

            // Hard redirect to login
            window.location.hash = 'login';
            location.reload();
            // Re-use existing redirection logic
            if (typeof redirectToLogin === 'function') {
                redirectToLogin();
            } else {
                window.location.hash = 'login';
                location.reload(); // Hard fallback
            }
            
        },
        doLogin: async function() {
            var email = $('#login-email').val().trim().toLowerCase();
            var pass = $('#login-pass').val().trim();
            
            try {
                const response = await fetch(`${BACKEND_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, pass })
                });
                const result = await response.json();
                
                if (!response.ok) throw new Error(result.message);

                // This is the CRITICAL part: call the function that switches the shell
                completeLogin(result.user); 
                
            } catch (e) {
                $('#login-msg').addClass('show error').text('❌ ' + e.message);
            }
        }
    };
}