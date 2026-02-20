import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";
import { connectDB, disconnectDB } from "./db";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
      console.log("\n🛑 Shutting down...");

      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    // Handle shutdown signals
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      shutdown();
    });

    // Handle uncaught Exception rejections
    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      shutdown();
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
