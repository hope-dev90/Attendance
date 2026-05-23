const express = require('express');

const router = express.Router();

const bearerAuth = {
  required: true,
  header: 'Authorization: Bearer <accessToken>',
  note: 'Use the accessToken returned from /api/auth/login, /api/auth/verify-otp, or /api/auth/refresh.',
};

const noAuth = {
  required: false,
};

const routes = [
  {
    group: 'System',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        auth: noAuth,
        description: 'Check whether the API server is running.',
      },
      {
        method: 'GET',
        path: '/api/routes',
        auth: noAuth,
        description: 'Developer integration guide for all public API routes.',
      },
      {
        method: 'GET',
        path: '/api/dev-guide',
        auth: noAuth,
        description: 'Alias for /api/routes.',
      },
    ],
  },
  {
    group: 'Auth',
    basePath: '/api/auth',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/signup',
        auth: noAuth,
        body: {
          full_name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
          class_id: 1,
        },
        success: '201 Created with message and email. User must verify OTP before login.',
      },
      {
        method: 'POST',
        path: '/api/auth/verify-otp',
        auth: noAuth,
        body: {
          email: 'jane@example.com',
          otp: '123456',
        },
        success: '200 OK with accessToken, refreshToken, and rep.',
      },
      {
        method: 'POST',
        path: '/api/auth/resend-otp',
        auth: noAuth,
        body: {
          email: 'jane@example.com',
        },
        success: '200 OK when a new OTP is sent.',
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        auth: noAuth,
        body: {
          email: 'jane@example.com',
          password: 'password123',
        },
        success: '200 OK with accessToken, refreshToken, and rep.',
      },
      {
        method: 'POST',
        path: '/api/auth/refresh',
        auth: noAuth,
        body: {
          refreshToken: '<refreshToken>',
        },
        success: '200 OK with a new accessToken and refreshToken.',
      },
      {
        method: 'POST',
        path: '/api/auth/logout',
        auth: bearerAuth,
        success: '200 OK when the current refresh token is cleared.',
      },
      {
        method: 'GET',
        path: '/api/auth/me',
        auth: bearerAuth,
        success: '200 OK with the authenticated rep profile and class.',
      },
    ],
  },
  {
    group: 'Classes',
    basePath: '/api/classes',
    endpoints: [
      {
        method: 'GET',
        path: '/api/classes',
        auth: noAuth,
        description: 'List classes for signup dropdowns.',
      },
      {
        method: 'POST',
        path: '/api/classes',
        auth: noAuth,
        body: {
          name: 'Level 3 Software Engineering',
        },
        description: 'Create a class. Currently public in the backend.',
      },
    ],
  },
  {
    group: 'Students',
    basePath: '/api/students',
    endpoints: [
      {
        method: 'GET',
        path: '/api/students/my-class',
        auth: bearerAuth,
        description: "List students in the logged-in representative's class.",
      },
      {
        method: 'GET',
        path: '/api/students/class/:classId',
        auth: bearerAuth,
        params: {
          classId: 'Class ID',
        },
        description: 'List students for a specific class.',
      },
      {
        method: 'POST',
        path: '/api/students/bulk',
        auth: bearerAuth,
        body: {
          students: [
            {
              student_number: 'STD001',
              full_name: 'Jane Doe',
              email: 'jane@example.com',
              class_id: 1,
            },
          ],
        },
        description: 'Create or update many students at once.',
      },
    ],
  },
  {
    group: 'Attendance',
    basePath: '/api/attendance',
    endpoints: [
      {
        method: 'POST',
        path: '/api/attendance',
        auth: bearerAuth,
        body: {
          session_date: '2026-05-18',
          records: [
            {
              student_id: 1,
              status: 'present',
              note: null,
            },
            {
              student_id: 2,
              status: 'absent',
              note: 'Sick',
            },
          ],
        },
        description: 'Submit attendance for today only. Valid statuses are present, absent, late, and excused.',
        success: '201 Created with session_id, delay status, and report counts when generated.',
      },
      {
        method: 'GET',
        path: '/api/attendance/history',
        auth: bearerAuth,
        description: "Get attendance history for the logged-in representative's class.",
      },
      {
        method: 'GET',
        path: '/api/attendance/absentees?date=YYYY-MM-DD&classId=1',
        auth: bearerAuth,
        query: {
          date: 'Optional attendance date filter.',
          classId: 'Optional class ID filter.',
        },
        description: 'List absent or late students. Filters are optional.',
      },
      {
        method: 'GET',
        path: '/api/attendance/:classId/:date',
        auth: bearerAuth,
        params: {
          classId: 'Class ID',
          date: 'Attendance date formatted as YYYY-MM-DD',
        },
        description: 'Get attendance records for one class on one date.',
      },
    ],
  },
  {
    group: 'Reports',
    basePath: '/api/reports',
    endpoints: [
      {
        method: 'GET',
        path: '/api/reports',
        auth: bearerAuth,
        description: 'List generated attendance reports.',
      },
      {
        method: 'GET',
        path: '/api/reports/:id/csv',
        auth: bearerAuth,
        params: {
          id: 'Report ID',
        },
        description: 'Download one report as CSV.',
      },
      {
        method: 'GET',
        path: '/api/reports/:id/pdf',
        auth: bearerAuth,
        params: {
          id: 'Report ID',
        },
        description: 'Download one report as PDF.',
      },
    ],
  },
];

const socketEvents = [
  {
    event: 'attendance:submitted',
    description: 'Emitted after attendance is submitted.',
    payload: {
      classId: 1,
      className: 'Level 3 Software Engineering',
      sessionDate: '2026-05-18',
      absentees: [],
    },
  },
  {
    event: 'report:ready',
    description: 'Emitted after a report has been generated.',
    payload: {
      classId: 1,
      className: 'Level 3 Software Engineering',
      sessionDate: '2026-05-18',
      counts: {
        total: 30,
        present: 28,
        late: 0,
        absent: 2,
      },
    },
  },
];

router.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  return res.json({
    name: 'ClassRep Backend API Integration Guide',
    baseUrl,
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    auth: {
      type: 'Bearer token',
      header: 'Authorization: Bearer <accessToken>',
      loginRoute: '/api/auth/login',
      refreshRoute: '/api/auth/refresh',
    },
    routes,
    socket: {
      url: baseUrl,
      events: socketEvents,
    },
    notes: [
      'All JSON requests must send Content-Type: application/json.',
      'Protected routes return 401 when the access token is missing, invalid, or expired.',
      'Attendance submission accepts today only and may be rejected before the attendance window opens.',
      'Use /api/classes first when building signup flows that need class IDs.',
    ],
  });
});

module.exports = router;
