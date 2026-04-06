/* ═══════════════════════════════════════════════════════
   DASHBOARD MODULE
═══════════════════════════════════════════════════════ */
const dashboard = {
    init: function() {
        if (_currentUser.role === 'admin') {
            this.renderAdminDashboard();
        } else {
            this.renderStudentDashboard();
        }
    },

    renderAdminDashboard: async function() {
        showLoading();
        const data = await fetchApiData('/public/dashboard/summary?top=20', () => {
            const users = ls('users') || [];
            const batches = ls('batches') || [];
            return {
                totalStudents: users.filter(u => u.role === 'student').length,
                activeBatchesCount: batches.filter(b => b.active).length,
                totalDocs: (ls('documents') || []).length,
                totalRecs: (ls('recordings') || []).length,
                activeBatches: batches,
                recentStudents: users.filter(u => u.role === 'student').slice(0, 5)
            };
        });

        const container = document.getElementById('dashboard-content');
        if (!container) return;

        container.innerHTML = `
            <div class="grid-4 anim-in">
                <div class="stat-card">
                    <div class="stat-num" style="background:var(--linear-v); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${data.totalStudents}</div>
                    <div class="stat-lbl">Total Students</div>
                </div>
                <div class="stat-card"><div class="stat-num">${data.activeBatchesCount}</div><div class="stat-lbl">Active Batches</div></div>
                <div class="stat-card"><div class="stat-num">${data.totalDocs}</div><div class="stat-lbl">Documents</div></div>
                <div class="stat-card"><div class="stat-num">${data.totalRecs}</div><div class="stat-lbl">Recordings</div></div>
            </div>
            `;
    },

    renderStudentDashboard: function() {
        // Implementation for student dashboard statistics and welcome message
        const container = document.getElementById('dashboard-content');
        container.innerHTML = `<h2 class="anim-in">Welcome, ${_currentUser.name}!</h2>`;
    }
};