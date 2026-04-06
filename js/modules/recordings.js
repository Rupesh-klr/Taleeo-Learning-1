/* ═══════════════════════════════════════════════════════
   RECORDINGS MODULE
═══════════════════════════════════════════════════════ */
const recordings = {
    init: function() {
        this.renderRecordings();
    },

    renderRecordings: async function() {
        showLoading();
        const recs = await fetchApiData('/admin/recordings', () => ls('recordings') || []);
        const list = document.getElementById('recordings-list');
        if (!list) return;

        if (recs.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:var(--muted);">No recordings found.</p>';
            return;
        }

        list.innerHTML = recs.map(r => `
            <div class="card anim-in">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                    <div style="display:flex; align-items:center; gap:14px;">
                        <div style="font-size:1.3rem;">🎥</div>
                        <div>
                            <div style="font-size:.9rem; font-weight:700; color:white;">${r.title}</div>
                            <div style="font-size:.72rem; color:var(--muted);">📅 ${r.date} · ⏱ ${r.duration}</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <a href="${r.url}" target="_blank" class="btn btn-out btn-sm">Watch ▶</a>
                        <button class="btn btn-danger btn-sm admin-only" onclick="recordings.deleteRec('${r.id}')">Delete</button>
                    </div>
                </div>
            </div>`).join('');
    },

    deleteRec: function(id) {
        if (!confirm('Delete this recording?')) return;
        let allRecs = ls('recordings') || [];
        allRecs = allRecs.filter(r => r.id !== id);
        ls('recordings', allRecs);
        this.renderRecordings();
        showToast('Recording removed.', '🗑️');
    }
};