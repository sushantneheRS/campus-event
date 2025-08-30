module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-here',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  JWT_COOKIE_EXPIRE: process.env.JWT_COOKIE_EXPIRE || 30,
  
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: false,
  
  // Account lockout settings
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 2 * 60 * 60 * 1000, // 2 hours
  
  // Session settings
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  // User roles
  USER_ROLES: {
    ADMIN: 'admin',
    ORGANIZER: 'organizer',
    PARTICIPANT: 'participant'
  },
  
  // Default permissions
  PERMISSIONS: {
    ADMIN: [
      'manage_users',
      'manage_events',
      'manage_categories',
      'view_analytics',
      'system_config',
      'manage_notifications'
    ],
    ORGANIZER: [
      'create_events',
      'manage_own_events',
      'view_registrations',
      'send_notifications',
      'view_event_analytics'
    ],
    PARTICIPANT: [
      'view_events',
      'register_events',
      'manage_profile',
      'view_own_registrations'
    ]
  }
};
