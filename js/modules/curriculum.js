/* ═══════════════════════════════════════════════════════
   CURRICULUM MODULE (Unified Admin & Student)
═══════════════════════════════════════════════════════ */
const curriculum = {
    _currentRole: null,
    _data: null, // Stores combined courses from backend lookups
    
    // The "init" function called by handleHashRouter
    init: function(navId) {
        this._currentRole = navId.split('-')[0]; // 'admin' or 'student'
        this.fetchCurriculum();
    },

    // Fetch combines courses/modules/batches lookup pattern
    fetchCurriculum: async function(searchTerm = '') {
        showLoading();
        
        // Foreign Key Pattern Call
        // This relies on the Backend executeAggregate getCourseFullDetails query
        this._data = await this._fetchApiData(`/admin/courses/search?q=${searchTerm}`, () => {
            // FALLBACK Logic if backend fails
            return this._fallbackData();
        });

        // Search bar UI is needed first
        this.renderCurriculumHeader(searchTerm);
        
        // Check state restoration to see if we were deep-dive
        let tabHistory = ls('tab_history') || {};
        const state = tabHistory[sessionStorage.getItem('lms_tab_id')];
        
        if (state && state.lastPage === 'module-detail' && state.lastArgs) {
            this.renderModuleDetail(state.lastArgs);
        } else {
            this.renderCourseGrid();
        }
    },

    // Renders the Pinned and main curriculum grid
    renderCourseGrid: function() {
        // ... (The renderAdminCurriculum code you provided in previous responses) ...
    },

    // Renders the Roadmap / Line-Wise UI (The Detailed View)
    renderModuleDetail: function(moduleId) {
        saveNavState('module-detail', moduleId);
        // ... (The Line-Wise UI rendering you provided in previous responses) ...
    },
    
    // Missing Admin edit function (as provided previously)
    openEditModuleModal: function(moduleId) {
        // ...
    },
    
    // Internal Helper for fallbacks
    _fallbackData: function() {
        // Convert the old static MODULES structure to the new hierarchical Course structure
        const mapped = MODULES.map(m => ({
            id: m.id.toString(),
            name: m.title,
            description: `Capstone course covering ${m.title}`,
            moduleDetails: m.topics.map(t => ({ id: 'fallback', title: t })),
            batchDetails: []
        }));
        return { totalRecords: mapped.length, courses: mapped };
    }
};