/* ═══════════════════════════════════════════════════════
   ATTENDANCE MODULE
═══════════════════════════════════════════════════════ */
const attendance = {
    init: function() {
        this.renderAttendance();
    },

    renderAttendance: async function() {
        const students = await fetchApiData('/admin/students', () => (ls('users') || []).filter(u => u.role === 'student'));
        const attData = await fetchApiData('/admin/attendance', () => ls('attendance') || {});
        
        const head = document.getElementById('attendance-table-head');
        const body = document.getElementById('attendance-table-body');
        if (!body) return;

        head.innerHTML = `<th>Student</th><th>Present</th><th>Total Sessions</th><th>Attendance %</th><th>Status</th>`;

        body.innerHTML = students.map(s => {
            const att = attData[s.id] || {};
            const totalDays = Object.keys(att).length;
            const presentDays = Object.values(att).filter(v => v === 'present').length;
            const totalSessions = Math.max(totalDays, 10);
            const pct = totalSessions > 0 ? Math.round(presentDays / totalSessions * 100) : 0;

            return `
                <tr>
                    <td style="font-weight:600;">${s.name}</td>
                    <td style="color:#6ee7b7;">${presentDays}</td>
                    <td>${totalSessions}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div class="progress-wrap" style="width:80px;"><div class="progress-fill" style="width:${pct}%;"></div></div>
                            <span style="font-size:.78rem;">${pct}%</span>
                        </div>
                    </td>
                    <td><span class="badge ${pct >= 75 ? 'badge-g' : 'badge-r'}">${pct >= 75 ? 'Good' : 'Low'}</span></td>
                </tr>`;
        }).join('');
    }
};