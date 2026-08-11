import express from "express";

import upload from "../middleware/uploadMiddleware.js";

import {
  uploadResume,
} from "../controllers/resumeController.js";

import {
  getResumes,
} from "../controllers/getResumeController.js";

import {
  deleteResume,
} from "../controllers/deleteResumeController.js";

import {
  compareResumes,
} from "../controllers/compareResumeController.js";


const router = express.Router();


// =========================================================
// GET ALL RESUMES
// =========================================================

router.get(
  "/",
  getResumes
);


// =========================================================
// UPLOAD + ANALYZE RESUME
// =========================================================

router.post(
  "/upload",
  upload.single("resume"),
  uploadResume
);


// =========================================================
// COMPARE SELECTED RESUMES
// OPTIONAL FEATURE
// =========================================================

router.post(
  "/compare",
  compareResumes
);


// =========================================================
// DELETE RESUME
// =========================================================

router.delete(
  "/:id",
  deleteResume
);


export default router;