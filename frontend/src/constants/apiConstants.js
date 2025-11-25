export const API_CONSTANTS = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.glutaessencial.online',
    TIMEOUT: 100000, 
    CSRF: '',
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
    REGISTER: '/api/register',
    
    // Password Reset APIs
    FORGOT_PASSWORD: '/api/password/forgot',
    VERIFY_RESET_TOKEN: '/api/password/verify-token',
    RESET_PASSWORD: '/api/password/reset',

    USER: '/api/user',
    ME: '/api/me',
    USERS: '/api/users',
    USER_PROFILE: '/api/user/profile',
    USER_SETTINGS: '/api/user/settings',
    PAYROLL: '/api/payroll',
    DELETE_PAYROLL: (id) => `/api/payroll/${id}`,
    BULK_DELETE_PAYROLLS: '/api/payroll/bulk-delete',
    VIEW_PAYROLL: (id) => `/api/payroll/${id}`,
    RELEASE_PAYROLL: (id) => `/api/payroll/release/${id}`,
    VIEW_PAYROLL_SHEET: (id, sheet) => `/api/payroll-sheet/${id}/${sheet}`,
    DOWNLOAD_PAYROLL_FILE: (id) => `/api/payroll/download/${id}`,
    PAYROLL_SUMMARY_STATS: '/api/payroll/summary-stats',
    PAYROLL_SHEETS: (id) => `/api/payroll/sheets/${id}`,

    // Payroll Generation
    PAYROLL_GENERATION_PREVIEW: '/api/payroll/generation/preview',
    PAYROLL_GENERATION_GENERATE: '/api/payroll/generation/generate',
    PAYROLL_GENERATION_VALIDATE: (batchId) => `/api/payroll/generation/validate/${batchId}`,

    // Payroll Approval Workflow
    PAYROLL_PENDING_APPROVALS: '/api/payroll/pending-approvals',
    PAYROLL_BATCHES: '/api/payroll/batches',
    PAYROLL_BATCH_STATS: (batchId) => `/api/payroll/batches/${batchId}/stats`,
    PAYROLL_BATCH_HISTORY: (batchId) => `/api/payroll/batches/${batchId}/history`,
    PAYROLL_SUBMIT_BATCH: (batchId) => `/api/payroll/batches/${batchId}/submit`,
    PAYROLL_APPROVE_BATCH: (batchId) => `/api/payroll/batches/${batchId}/approve`,
    PAYROLL_REJECT_BATCH: (batchId) => `/api/payroll/batches/${batchId}/reject`,
    PAYROLL_PUBLISH_BATCH: (batchId) => `/api/payroll/batches/${batchId}/publish`,
    PAYROLL_LOCK_BATCH: (batchId) => `/api/payroll/batches/${batchId}/lock`,
    PAYROLL_PAYSLIP_HISTORY: (payslipId) => `/api/payroll/payslips/${payslipId}/history`,
    PAYROLL_EXPORT_BATCH: (batchId) => `/api/payroll/batches/${batchId}/export`,

    // Payroll Templates
    PAYROLL_TEMPLATES: '/api/payroll-templates',
    GET_AVAILABLE_TEMPLATE_FIELDS: '/api/payroll-templates/available-fields',
    GET_DEFAULT_TEMPLATE: '/api/payroll-templates/default',
    GET_PAYROLL_TEMPLATE: (id) => `/api/payroll-templates/${id}`,
    CREATE_PAYROLL_TEMPLATE: '/api/payroll-templates',
    UPDATE_PAYROLL_TEMPLATE: (id) => `/api/payroll-templates/${id}`,
    DELETE_PAYROLL_TEMPLATE: (id) => `/api/payroll-templates/${id}`,
    SET_DEFAULT_TEMPLATE: (id) => `/api/payroll-templates/${id}/set-default`,
    TOGGLE_TEMPLATE_ACTIVE: (id) => `/api/payroll-templates/${id}/toggle-active`,
    DOWNLOAD_PAYROLL_TEMPLATE: (id) => `/api/payroll-templates/${id}/download`, 

    GENERATE_PAYSLIPS: (id) => `/api/payslip/generate-payslips/${id}`,
    CREATE_PAYSLIP: '/api/payslips',
    GET_PAYSLIPS: '/api/payslips',
    GET_RECENT_PAYSLIPS_WITH_SUMMARY_STATS: '/api/payslip/recent-payslips-with-summary-stats',
    GENERATE_PAYSLIP_PDF: (id) => `/api/payslip/generate-pdf/${id}`,
    GET_SIGNED_DOWNLOAD_URL: (id) => `/api/payslip/signed-url/${id}`,
    USERS: '/api/users',
    GET_USER_LIST: '/api/users/list',
    DELETE_USER: (id) => `/api/users/${id}`,
    VIEW_USER: (id) => `/api/users/${id}`,
    GET_USER_PROFILE: (id) => `/api/users/${id}/profile`,
    CREATE_USER: '/api/users',
    UPDATE_USER: (id) => `/api/users/${id}`,
    UPDATE_PROFILE: '/api/me/profile',
    UPDATE_PROFILE_PICTURE: '/api/me/profile/picture',
    CHANGE_PASSWORD: '/api/me/change-password',

    ROLES: '/api/roles',
    DELETE_ROLE: (id) => `/api/roles/${id}`,
    VIEW_ROLE: (id) => `/api/roles/${id}`,
    CREATE_ROLE: '/api/roles',
    UPDATE_ROLE: (id) => `/api/roles/${id}`,
    ROLE_OPTIONS: '/api/roles/options',
    GET_ALL_USER_PAYSLIPS: '/api/payslips/user-payslips',
    GET_SELECTED_PAYSLIP: (id) => `/api/payslips/${id}/edit`,
    UPDATE_PAYSLIP: (id) => `/api/payslips/${id}`,
    UPDATE_USER_PAYSLIP: (id) => `/api/payslips/update-user-payslip/${id}`,
    DELETE_PAYSLIP: (id) => `/api/payslips/${id}`,
    BULK_DELETE_PAYSLIPS: '/api/payslips/bulk-delete',

    // Dashboard API endpoints
    DASHBOARD_QUICK_STATS: '/api/dashboard/quick-stats',
    DASHBOARD_ADMIN_STATS: '/api/dashboard/admin-stats',
    DASHBOARD_ADMIN_DASHBOARD: '/api/dashboard/admin-dashboard',
    DASHBOARD_SYSTEM_ACTIVITIES: '/api/dashboard/system-activities',
    DASHBOARD_STORAGE_INFO: '/api/dashboard/storage-info',

    // Attendance API endpoints
    ATTENDANCE_CLOCK_IN: '/api/attendance/clock-in',
    ATTENDANCE_CLOCK_OUT: '/api/attendance/clock-out',
    ATTENDANCE_STATUS: '/api/attendance/status',
    ATTENDANCE_TODAY: '/api/attendance/today',
    ATTENDANCE_HISTORY: '/api/attendance/history',
    GET_USER_ATTENDANCE: '/api/attendance/user-attendance',
    ATTENDANCE_RECENT: '/api/attendance/recent',
    ATTENDANCE_BREAK_START: '/api/attendance/break/start',
    ATTENDANCE_BREAK_END: '/api/attendance/break/end',
    ATTENDANCE_STATS: '/api/attendance/stats',
    ATTENDANCE_WEEKLY_SUMMARY: '/api/attendance/weekly-summary',
    ATTENDANCE_WEEKLY_ATTENDANCE: '/api/attendance/weekly-attendance',
    ATTENDANCE_EXPORT: '/api/attendance/export',
    ATTENDANCE_EXPORT_FILTERED: '/api/attendance/export-filtered',
    ATTENDANCE_REPORTS: '/api/attendance/reports',
    ATTENDANCE_REPORTS_EXPORT: '/api/attendance/reports/export',
    ATTENDANCE_VALIDATE_LOCATION: '/api/attendance/validate-location',
    
    // Manual Attendance Management
    CREATE_MANUAL_ATTENDANCE: '/api/attendance/manual',
    UPDATE_ATTENDANCE: (id) => `/api/attendance/${id}`,
    DELETE_ATTENDANCE: (id) => `/api/attendance/${id}`,
    
    // Work Locations
    WORK_LOCATIONS: '/api/locations',
    CREATE_WORK_LOCATION: '/api/locations',
    UPDATE_WORK_LOCATION: (id) => `/api/locations/${id}`,
    DELETE_WORK_LOCATION: (id) => `/api/locations/${id}`,
    
    // Work Schedules
    WORK_SCHEDULES: '/api/schedules',
    MY_WORK_SCHEDULE: '/api/schedules/my-schedule',
    CREATE_WORK_SCHEDULE: '/api/schedules',
    UPDATE_WORK_SCHEDULE: (id) => `/api/schedules/${id}`,
    DELETE_WORK_SCHEDULE: (id) => `/api/schedules/${id}`,

    // Company Profile
    COMPANY_PROFILE: '/api/company-profile',
    COMPANY_PROFILE_UPLOAD_LOGO: '/api/company-profile/logo',
    COMPANY_PROFILE_REMOVE_LOGO: '/api/company-profile/logo',
    COMPANY_PROFILE_OPTIONS: '/api/company-profile/options',

    // Notifications
    NOTIFICATIONS: {
        LIST: '/api/notifications',
        STATS: '/api/notifications/stats',
        UNREAD_COUNT: '/api/notifications/unread-count',
        RECENT: '/api/notifications/recent',
        DETAILS: '/api/notifications/:id',
        MARK_READ: '/api/notifications/mark-as-read',
        MARK_ALL_READ: '/api/notifications/mark-all-as-read',
        ARCHIVE: '/api/notifications/archive',
        DELETE: '/api/notifications/delete',
        CREATE_SYSTEM: '/api/notifications/system'
    },

    // Dynamic Payroll Management
    PAYROLL_COMPONENTS: '/api/payroll-components',
    CREATE_PAYROLL_COMPONENT: '/api/payroll-components',
    GET_PAYROLL_COMPONENT: (id) => `/api/payroll-components/${id}`,
    UPDATE_PAYROLL_COMPONENT: (id) => `/api/payroll-components/${id}`,
    DELETE_PAYROLL_COMPONENT: (id) => `/api/payroll-components/${id}`,
    TOGGLE_PAYROLL_COMPONENT: (id) => `/api/payroll-components/${id}/toggle`,
    GET_COMPONENTS_BY_TYPE: (type) => `/api/payroll-components/type/${type}`,

    PAYROLL_FORMULAS: '/api/payroll-formulas',
    CREATE_PAYROLL_FORMULA: '/api/payroll-formulas',
    GET_PAYROLL_FORMULA: (id) => `/api/payroll-formulas/${id}`,
    UPDATE_PAYROLL_FORMULA: (id) => `/api/payroll-formulas/${id}`,
    DELETE_PAYROLL_FORMULA: (id) => `/api/payroll-formulas/${id}`,
    TOGGLE_PAYROLL_FORMULA: (id) => `/api/payroll-formulas/${id}/toggle`,
    GET_FORMULAS_BY_COMPONENT: (componentId) => `/api/payroll-formulas/component/${componentId}`,

    PAYROLL_CALCULATION: {
        PREVIEW: '/api/payroll-calculation/preview',
        CALCULATE: '/api/payroll-calculation/calculate',
        RECALCULATE: (payslipId) => `/api/payroll-calculation/payslips/${payslipId}/recalculate`,
        BREAKDOWN: (payslipId) => `/api/payroll-calculation/payslips/${payslipId}/breakdown`
    },

    // Employee Payroll Overrides - Employee-specific payroll customizations
    EMPLOYEE_PAYROLL_OVERRIDES: '/api/employee-payroll-overrides',
    GET_EMPLOYEE_OVERRIDES: (employeeId) => `/api/employee-payroll-overrides/employee/${employeeId}`,
    GET_AVAILABLE_COMPONENTS: (employeeId) => `/api/employee-payroll-overrides/employee/${employeeId}/available-components`,
    CREATE_EMPLOYEE_OVERRIDE: '/api/employee-payroll-overrides',
    GET_EMPLOYEE_OVERRIDE: (id) => `/api/employee-payroll-overrides/${id}`,
    UPDATE_EMPLOYEE_OVERRIDE: (id) => `/api/employee-payroll-overrides/${id}`,
    DELETE_EMPLOYEE_OVERRIDE: (id) => `/api/employee-payroll-overrides/${id}`,
    TOGGLE_EMPLOYEE_OVERRIDE: (id) => `/api/employee-payroll-overrides/${id}/toggle`
};