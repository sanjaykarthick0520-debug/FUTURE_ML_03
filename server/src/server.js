import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import resumeRoutes from "./routes/resumeRoutes.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// Middleware
// ==============================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ==============================
// Serve uploaded resumes
// ==============================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// ==============================
// Health Check
// ==============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to HireSense API 🚀",
  });
});

// ==============================
// Routes
// ==============================

app.use(
  "/api/resume",
  resumeRoutes
);

// ==============================
// 404 Handler
// ==============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ==============================
// Error Handler
// ==============================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// ==============================
// Start Server
// ==============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 HireSense API running on http://localhost:${PORT}`
  );
});