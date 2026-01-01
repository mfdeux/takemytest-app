// Example of a simple universal logger implementation structure (using a generic approach)
import { Logger } from "@graphile/logger";
import winston, { format } from "winston";

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    // In the browser, this automatically falls back to the console API
    new winston.transports.Console({
      // Add formatting options if needed
    }),
    // For Node.js (background tasks/CLI), you might add file transports
    // if (typeof window === 'undefined') {
    //   new winston.transports.File({ filename: 'app.log' })
    // }
  ],
});

function logFunctionFactory(scope: any) {
  // You can add the scope details (task name, worker ID) as metadata in Winston
  const scopedLogger = logger.child(scope);

  return (level: any, message: any, meta?: any) => {
    // Map Graphile level (error, warning, info, debug) to Winston level
    switch (level) {
      case "error":
        return scopedLogger.error(message, meta);
      case "warning":
        return scopedLogger.warn(message, meta);
      case "info":
        return scopedLogger.info(message, meta);
      case "debug":
        return scopedLogger.debug(message, meta);
      default:
        // Fallback for any other log level
        return scopedLogger.info(message, meta);
    }
  };
}

export const graphileLogger = new Logger(logFunctionFactory);

export default logger;
