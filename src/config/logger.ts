import pino from "pino";
import pinoHttp from "pino-http";

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),

  // Minimum required field for production
  base: {
    env: process.env.NODE_ENV,
    service: "feature-flag-api",
    version: process.env.npm_package_version,
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  // Format error objects properly
  formatters: {
    level: (label) => {
      return { level: label };
    },
    /*
    # The below syntax is of no use until or unless VPS such as AWS EC2 or DigitalOcean are being used for debugging exactly which process is being affected 
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        hostname: bindings.hostname,
      };
    },
    */
  },

  // Serialize error objects
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },

  // Redacts sensitive data
  redact: {
    paths: [
      // Headers
      "req.headers.authorization",
      'req.headers["x-api-key"]',

      // Body fields
      "password",
      "body.password",
      "body.email",
      "token",
      "accessToken",
      "refreshToken",
      "apiKey",
      "*.apiKey", // Catches apiKey at any depth
      "secret",
    ],
    censor: "[REDACTED]",
  },

  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  }),
});

export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => {
      const ignoredPaths = ["/health", "/favicon.ico", "/metrics"];
      return ignoredPaths.includes(req.url || "");
    },
  },

  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },

  customSuccessMessage: (req, res) => {
    if (res.statusCode >= 400) {
      return `${req.method} ${req.url} rejected with status ${res.statusCode}`;
    }
    return `${req.method} ${req.url} completed successfully`;
  },

  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} crashed ${err.message}`;
  },

  customProps: (req: any) => ({
    userId: req.user?.id,
  }),
});

export const createLogger = (module: string) => {
  return logger.child({ module });
};
