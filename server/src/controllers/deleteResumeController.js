import fs from "fs";
import path from "path";
import prisma from "../config/prisma.js";

export const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;

    // Find resume
    const resume = await prisma.resume.findUnique({
      where: {
        id,
      },
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found.",
      });
    }

    // Delete associated analyses first
    await prisma.analysis.deleteMany({
      where: {
        resumeId: resume.id,
      },
    });

    // Delete database record
    await prisma.resume.delete({
      where: {
        id: resume.id,
      },
    });

    // Delete physical PDF file
    try {
      const filePath = path.join(
        process.cwd(),
        "src",
        resume.fileUrl.replace(
          /^\/uploads\//,
          "uploads/"
        )
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error(
        "Could not delete physical file:",
        fileError
      );
    }

    return res.json({
      success: true,
      message: "Resume deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete resume error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete resume.",
    });
  }
};