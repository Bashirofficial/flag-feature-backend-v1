import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB, disconnectDB } from "./db";
import { logger } from "./config/logger";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(
        { port: PORT, env: process.env.NODE_ENV },
        "🚀 Server started successfully",
      );
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.warn({ signal }, "🛑 Shutting down server...");

      server.close(async () => {
        try {
          await disconnectDB();
          logger.info("Successfully disconnected from DB.");
          process.exit(0);
        } catch (err) {
          logger.error({ err }, "Error during DB connection.");
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error({ reason, promise }, "Unhandled Rejection at Promise");
      shutdown("unhandledRejection");
    });

    // Handle uncaught Exception
    process.on("uncaughtException", (err) => {
      logger.fatal({ err }, "Uncaught Exception detected!");
      shutdown("uncaughtException");
    });
  } catch (error) {
    logger.error({ err: error }, "❌ Failed to start server");
    process.exit(1);
  }
};

// Start the server
startServer();
