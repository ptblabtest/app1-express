import express from "express";
import helmet from "helmet";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import authRoutes from "@/routes/auth";
import sharedRoutes from "@/routes/sharedRoutes";
import prisma from "@/lib/prisma";
import { PrismaSessionStore } from "@/lib/sessionStore";
import spacesRoutes from '@/routes/spacesRoutes';
import moduleRoutes from "@/routes/module";
import fileRoutes from "@/routes/fileRoutes";

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || "development";

const ENABLE_CONSOLE = process.env.ENABLE_CONSOLE !== "false";

if (!ENABLE_CONSOLE) {
  const noop = () => {};
  console.log = noop;
  console.error = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
  console.table = noop;
}

// const FRONTEND_URL =
//   process.env.FRONTEND_URL ||
//   (NODE_ENV === "production"
//     ? (() => {
//         throw new Error("FRONTEND_URL is required in production");
//       })()
//     : "http://localhost:3000");

if (process.env.NODE_ENV === "development") {
  process.on("uncaughtException", console.error);
  process.on("unhandledRejection", console.error);
}

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      (NODE_ENV === "production"
        ? (() => {
            throw new Error("SESSION_SECRET is required in production");
          })()
        : "dev-secret-key"),
    store: new PrismaSessionStore(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (_req, res) => {
  res.json({
    message: `Welcome to your Express server! ${process.env.APP_NAME}`,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", sharedRoutes);
app.use('/api/spaces-test', spacesRoutes);
app.use("/api", moduleRoutes);
app.use("/api/files", fileRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", {
      message: err.message,
      code: err.code,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      path: _req.path,
      method: _req.method,
    });

    // Prisma specific errors
    if (err.code === "P2002") {
      return res.status(400).json({
        message: "A record with this value already exists",
      });
    }

    if (err.code === "P2025") {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    // Database connection errors
    if (err.code === "P2024") {
      return res.status(500).json({
        message: "Database connection timeout",
      });
    }

    // Default error response
    res.status(err.status || 500).json({
      message:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : err.message || "Internal Server Error",
    });
  }
);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in environment variables");
  process.exit(1);
}

(async () => {
  try {
    console.log("Checking database connection...");
    await prisma.$connect();
    console.log("Database connection successful.");
    app.listen(PORT, () => {
      console.log(
        `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });
    console.log("Running scheduler at app startup...");
  } catch (err) {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
  }
})();

process.on("SIGINT", async () => {
  console.log("Received SIGINT. Cleaning up...");
  try {
    await prisma.$disconnect();
    console.log("Prisma disconnected. Exiting process.");
  } catch (err) {
    console.warn("Error during Prisma disconnect:", err);
  } finally {
    process.exit();
  }
});
