/* ═══════════════════════════════════════════════════════
   CENTRALIZED hash-based routes mapping
═══════════════════════════════════════════════════════ */
const ROUTES = {
  // Authentication (Global)
  "login": "pages/login.html",
  "signup": "pages/signup.html",

  // Admin Modules
  "admin-dashboard": "pages/dashboard.html",
  "admin-batches": "pages/batches.html",
  "admin-students": "pages/students.html",
  "admin-curriculum": "pages/curriculum.html", // Admin views this for management
  "admin-documents": "pages/documents.html",
  "admin-recordings": "pages/recordings.html",
  "admin-attendance": "pages/attendance.html",
  "admin-certificates": "pages/certificates.html",

  // Student Modules
  "student-dashboard": "pages/dashboard.html",
  "student-course": "pages/curriculum.html", // Student views this as course content
  "student-recordings": "pages/recordings.html",
  "student-documents": "pages/documents.html",
  "student-attendance": "pages/attendance.html",
  "student-certificate": "pages/certificates.html",

  // Default routes based on role if no hash is present
  "default": {
    "admin": "admin-dashboard",
    "student": "student-dashboard"
  }
};