import prisma from "../config/prisma.js";
import {
  generateCandidateRecommendation,
} from "../services/geminiService.js";

export const compareResumes = async (req, res) => {
  try {
    const { resumeIds, targetRole } = req.body;

    // ---------------------------------------------------------
    // Validate resume IDs
    // ---------------------------------------------------------

    if (!Array.isArray(resumeIds)) {
      return res.status(400).json({
        success: false,
        message: "resumeIds must be an array.",
      });
    }

    if (resumeIds.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Please select at least 2 resumes to compare.",
      });
    }

    if (resumeIds.length > 10) {
      return res.status(400).json({
        success: false,
        message:
          "You can compare a maximum of 10 resumes at a time.",
      });
    }

    // ---------------------------------------------------------
    // Remove duplicate IDs
    // ---------------------------------------------------------

    const uniqueResumeIds = [
      ...new Set(resumeIds),
    ];

    if (uniqueResumeIds.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Please select at least 2 different resumes.",
      });
    }

    // ---------------------------------------------------------
    // Fetch selected resumes + analyses
    // ---------------------------------------------------------

    const resumes = await prisma.resume.findMany({
      where: {
        id: {
          in: uniqueResumeIds,
        },
      },

      include: {
        analyses: {
          orderBy: {
            createdAt: "desc",
          },

          take: 1,
        },
      },
    });

    // ---------------------------------------------------------
    // Make sure all requested resumes exist
    // ---------------------------------------------------------

    if (
      resumes.length !==
      uniqueResumeIds.length
    ) {
      return res.status(404).json({
        success: false,
        message:
          "One or more selected resumes could not be found.",
      });
    }

    // ---------------------------------------------------------
    // Make sure every resume has an analysis
    // ---------------------------------------------------------

    const resumesWithoutAnalysis =
      resumes.filter(
        (resume) =>
          !resume.analyses ||
          resume.analyses.length === 0
      );

    if (
      resumesWithoutAnalysis.length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All selected resumes must have a completed analysis before comparison.",
      });
    }

    // ---------------------------------------------------------
    // Determine target role
    // ---------------------------------------------------------

    const selectedTargetRole =
      targetRole?.trim() ||
      resumes[0]?.targetRole ||
      resumes[0]?.analyses?.[0]?.targetRole ||
      null;

    // ---------------------------------------------------------
    // Build comparison data
    // ---------------------------------------------------------

    const candidates = resumes.map(
      (resume) => {
        const analysis =
          resume.analyses[0];

        return {
          id: resume.id,

          name:
            resume.originalName ||
            resume.title,

          originalName:
            resume.originalName,

          title:
            resume.title,

          targetRole:
            resume.targetRole ||
            selectedTargetRole,

          overallScore:
            analysis.overallScore,

          jobMatch:
            analysis.jobMatch,

          keywordMatch:
            analysis.keywordMatch,

          technicalSkills:
            analysis.technicalSkills,

          experienceRelevance:
            analysis.experienceRelevance,

          projectRelevance:
            analysis.projectRelevance,

          resumeStructure:
            analysis.resumeStructure,

          strengths:
            analysis.strengths,

          weaknesses:
            analysis.weaknesses,

          missingKeywords:
            analysis.missingKeywords,

          suggestions:
            analysis.suggestions,

          uploadedAt:
            resume.uploadedAt,
        };
      }
    );

    // ---------------------------------------------------------
    // Calculate ranking score
    //
    // 50% ATS score
    // 50% target-role match
    // ---------------------------------------------------------

    const rankedCandidates =
      candidates
        .map((candidate) => {
          const ats =
            Number(
              candidate.overallScore
            ) || 0;

          const jobMatch =
            Number(
              candidate.jobMatch
            ) || 0;

          const rankingScore =
            Math.round(
              ats * 0.5 +
              jobMatch * 0.5
            );

          return {
            ...candidate,
            rankingScore,
          };
        })
        .sort(
          (a, b) =>
            b.rankingScore -
            a.rankingScore
        );

    // ---------------------------------------------------------
    // Assign ranking position
    // ---------------------------------------------------------

    const rankedResults =
      rankedCandidates.map(
        (candidate, index) => ({
          ...candidate,
          rank: index + 1,
        })
      );

    // ---------------------------------------------------------
    // AI recommendation
    //
    // This is OPTIONAL from the user's perspective.
    // The comparison still has the normal ranking even if
    // Gemini recommendation fails.
    // ---------------------------------------------------------

    let aiRecommendation = null;

    try {
      console.log(
        "Generating AI candidate recommendation..."
      );

      aiRecommendation =
        await generateCandidateRecommendation(
          rankedResults,
          selectedTargetRole
        );

      console.log(
        "AI candidate recommendation completed."
      );
    } catch (aiError) {
      console.error(
        "AI recommendation failed:",
        aiError
      );

      /*
       * Do NOT fail the entire comparison if Gemini
       * temporarily fails.
       *
       * The normal ATS + Role Match comparison
       * can still be displayed.
       */

      aiRecommendation = {
        available: false,
        message:
          "AI recommendation is temporarily unavailable. The candidate ranking is still available.",
      };
    }

    // ---------------------------------------------------------
    // Return comparison result
    // ---------------------------------------------------------

    return res.status(200).json({
      success: true,

      targetRole:
        selectedTargetRole,

      count:
        rankedResults.length,

      candidates:
        rankedResults,

      aiRecommendation,
    });
  } catch (error) {
    console.error(
      "Resume comparison error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to compare resumes.",
    });
  }
};