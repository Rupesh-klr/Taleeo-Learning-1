/* ═══════════════════════════════════════════════════════
   BATCHES MODULE
═══════════════════════════════════════════════════════ */
const batches = {
    init: function() {
        this.renderBatches();
    },

    renderBatches: async function() {
        showLoading();
        const batchesList = await fetchApiData('/admin/batches', () => ls('batches') || []);
        const users = await fetchApiData('/admin/students?limit=100', () => ls('users') || []);

        const grid = document.getElementById('batches-grid');
        if (!grid) return;

        grid.innerHTML = batchesList.map(b => {
            const studentCount = b.students ? b.students.length : 0;
            const daysLeft = Math.max(0, Math.ceil((new Date(b.end) - new Date()) / 86400000));
            
            return `
                <div class="card anim-in">
                    <div style="display:flex; justify-content:space-between; margin-bottom:14px;">
                        <div>
                            <div style="font-size:1rem; font-weight:700; color:white;">${b.name}</div>
                            <span class="badge ${b.type === 'weekend' ? 'badge-v' : 'badge-b'}">${b.type}</span>
                        </div>
                        <span class="badge ${daysLeft > 0 ? 'badge-g' : 'badge-r'}">${daysLeft > 0 ? daysLeft + 'd left' : 'Ended'}</span>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:.78rem; color:var(--muted);">
                        <div>⏰ ${b.timing}</div>
                        <div>👥 ${studentCount} Students</div>
                    </div>
                    <div class="zoom-card" style="margin-top:14px;">
                        <div style="font-size:.72rem; color:var(--muted);">ID: ${b.zoomId}</div>
                        <a href="${b.zoomLink}" target="_blank" style="font-size:.72rem; color:var(--b2);">${b.zoomLink}</a>
                    </div>
                    <div style="display:flex; gap:8px; margin-top:14px;">
                        <button class="btn btn-danger btn-sm admin-only" onclick="batches.toggleBatch('${b.id}')">
                            ${b.active ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>`;
        }).join('');
    },

    toggleBatch: function(id) {
        let allBatches = ls('batches') || [];
        const idx = allBatches.findIndex(b => b.id === id);
        if (idx >= 0) {
            allBatches[idx].active = !allBatches[idx].active;
            ls('batches', allBatches);
            this.renderBatches();
            showToast('Batch status updated.', '✅');
        }
    }
};