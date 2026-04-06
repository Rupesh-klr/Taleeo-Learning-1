// Use 'var' or a conditional check to prevent redeclaration errors
if (typeof curriculum === 'undefined') {
    var curriculum = {
        init: function(hash) {
            console.log("📚 Initializing Curriculum Module...");
            this.renderAdminCurriculum();
        },

        renderAdminCurriculum: async function(searchTerm = '') {
            showLoading();
            const mc = document.getElementById('main-content');
            
            // Backend call for joined data (Course -> Modules -> Batches)
            const data = await fetchApiData(`/admin/courses/search?q=${searchTerm}`, () => {
                // Fallback using static MODULES if server is offline
                const local = MODULES.map(m => ({
                    id: m.id.toString(),
                    name: m.title,
                    moduleDetails: m.topics.map(t => ({ title: t })),
                    batchDetails: []
                })).filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
                return { totalRecords: local.length, courses: local };
            });

            const pinnedIds = ls('pinned_courses') || [];
            const courses = data.courses || [];
            
            mc.innerHTML = `
                <div class="topbar">
                    <div class="topbar-left"><div class="topbar-title">Course Curriculum</div></div>
                    <div class="topbar-right">
                        <input type="text" class="form-input" placeholder="Search..." 
                               oninput="curriculum.renderAdminCurriculum(this.value)" style="width:200px;">
                    </div>
                </div>
                <div class="grid-3">
                    ${courses.map(c => this._renderCard(c, pinnedIds.includes(c.id))).join('')}
                </div>
            `;
        },

        _renderCard: function(course, isPinned) {
            return `
                <div class="module-card anim-in">
                    <div class="mc-top">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div class="mc-num">${course.moduleDetails?.length || 0} Modules</div>
                            <span style="cursor:pointer;" onclick="curriculum.togglePin('${course.id}')">
                                ${isPinned ? '📌' : '📍'}
                            </span>
                        </div>
                        <div class="mc-title">${course.name}</div>
                    </div>
                    <div class="mc-bottom">
                        <span class="badge badge-b">${course.batchDetails?.length || 0} Batches</span>
                        <button class="btn btn-out btn-sm" onclick="curriculum.renderModuleDetail('${course.id}')">View Details</button>
                    </div>
                </div>`;
        },

        renderModuleDetail: function(courseId) {
            // Save state for tab recovery
            saveNavState('module-detail', courseId);
            const mc = document.getElementById('main-content');
            
            // UI logic for line-wise syllabus
            mc.innerHTML = `
                <button class="btn btn-back btn-sm" onclick="navTo('admin-curriculum')">← Back</button>
                <div class="syllabus-container anim-in">
                    <div class="syllabus-item">
                         <div class="syllabus-header"><span class="syllabus-index">STEP 01</span></div>
                         <div style="color:white; font-weight:600;">Core Module Logic</div>
                    </div>
                </div>
            `;
        },

        togglePin: function(id) {
            let pinned = ls('pinned_courses') || [];
            pinned = pinned.includes(id) ? pinned.filter(p => p !== id) : [...pinned, id];
            ls('pinned_courses', pinned);
            this.renderAdminCurriculum();
        }
    };
}