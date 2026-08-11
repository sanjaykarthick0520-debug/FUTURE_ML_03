import prisma from "../config/prisma.js";

export const getResumes = async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      orderBy: {
        uploadedAt: "desc",
      },
      include: {
        analyses: true,
      },
    });

    res.json({
      success: true,
      count: resumes.length,
      resumes,
    });
  } catch (error) {
    console.error(
      "Failed to fetch resumes:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch resumes",
    });
  }
};