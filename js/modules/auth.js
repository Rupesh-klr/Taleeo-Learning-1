/* ═══════════════════════════════════════════════════════
   AUTH MODULE
═══════════════════════════════════════════════════════ */
const auth = {
    _loginPending: null,

    doLogin: async function() {
        var email = document.getElementById('login-email').value.trim().toLowerCase();
        var pass = document.getElementById('login-pass').value.trim();
        var msg = document.getElementById('login-msg');

        if (USE_SERVER) {
            try {
                const response = await fetch(`${BACKEND_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, pass })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                if (result.requiresOtp) {
                    this._loginPending = result.user;
                    document.getElementById('step-login').style.display = 'none';
                    document.getElementById('step-otp').style.display = 'block';
                } else {
                    completeLogin(result.user);
                }
            } catch (e) {
                msg.className = 'login-msg show error';
                msg.textContent = '❌ ' + e.message;
            }
        }
    },

    doLogout: function() {
        _currentUser = null;
        localStorage.removeItem('tlms_session_user');
        redirectToLogin();
    }
};