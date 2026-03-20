export const LOG_EVENTS = {
  // User
  USER_LOGIN: "user.login_success",
  USER_LOGIN_FAILED: "user.login_failed",
  USER_REGISTER: "user.registration_success",
  USER_LOGOUT: "user.logout_success",
  USER_TOKEN_REFRESH: "user.token_refresh",

  // Feature Flags
  FLAG_CREATE: "flag.created",
  FLAG_UPDATE: "flag.updated",
  FLAG_DELETE: "flag.deleted",
  FLAG_TOGGLE: "flag.status_toggled",

  // API Keys
  API_KEY_GENERATE: "api_key.generated",
  API_KEY_REVOKE: "api_key.revoked",
  API_KEY_DELETE: "api_key.deleted",

  // Environments
  ENV_CREATE: "environment.created",
  ENV_UPDATE: "environment.updated",
  ENV_DELETE: "environment.deleted",

  // System
  DB_TRANSACTION_ERROR: "system.db_transaction_failed",
} as const;
