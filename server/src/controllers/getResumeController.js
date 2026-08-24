import prisma from "../config/prisma.js";

function getCareerAlignment(
  predictedCategory,
  targetRole,
  jobMatch
) {
  const category = String(
    predictedCategory || ""
  ).toLowerCase();

  const role = String(
    targetRole || ""
  ).toLowerCase();

  const score = Number(jobMatch);

  const roleMatchesCategory =
    (category.includes("information-technology") &&
      /software|developer|development|web|frontend|backend|full.?stack|data|machine learning|ai|cloud|devops|it|cyber|technology/.test(role)) ||

    (category.includes("engineering") &&
      /engineer|engineering|mechanical|civil|electrical|electronics/.test(role)) ||

    (category.includes("accountant") &&
      /account|audit|tax|bookkeep|accountant/.test(role)) ||

    (category.includes("finance") &&
      /finance|financial|investment|analyst/.test(role)) ||

    (category.includes("banking") &&
      /bank|banking|financial services/.test(role)) ||

    (category.includes("hr") &&
      /human resource|hr|recruit/.test(role)) ||

    (category.includes("sales") &&
      /sales|business development|account manager/.test(role)) ||

    (category.includes("business-development") &&
      /business development|business/.test(role)) ||

    (category.includes("designer") &&
      /design|designer|ui|ux|graphic/.test(role)) ||

    (category.includes("digital-media") &&
      /media|content|social media|digital/.test(role)) ||

    (category.includes("public-relations") &&
      /public relations|pr|communications/.test(role)) ||

    (category.includes("teacher") &&
      /teacher|teaching|education|educator|faculty/.test(role)) ||

    (category.includes("healthcare") &&
      /health|healthcare|nurse|medical|clinical/.test(role)) ||

    (category.includes("chef") &&
      /chef|culinary|cook|kitchen|hospitality/.test(role)) ||

    (category.includes("aviation") &&
      /aviation|pilot|airline|airport/.test(role)) ||

    (category.includes("construction") &&
      /construction|site engineer|civil/.test(role)) ||

    (category.includes("consultant") &&
      /consultant|consulting/.test(role)) ||

    (category.includes("advocate") &&
      /lawyer|legal|advocate|attorney/.test(role)) ||

    (category.includes("agriculture") &&
      /agriculture|agricultural|farming/.test(role)) ||

    (category.includes("automobile") &&
      /automobile|automotive|vehicle/.test(role)) ||

    (category.includes("apparel") &&
      /apparel|fashion|textile/.test(role)) ||

    (category.includes("arts") &&
      /artist|arts|creative/.test(role)) ||

    (category.includes("fitness") &&
      /fitness|trainer|gym|sports/.test(role)) ||

    (category.includes("bpo") &&
      /bpo|customer service|process associate/.test(role));

  if (
    roleMatchesCategory &&
    Number.isFinite(score) &&
    score >= 70
  ) {
    return "Strong Match";
  }

  if (
    roleMatchesCategory ||
    (Number.isFinite(score) && score >= 70)
  ) {
    return "Moderate Match";
  }

  return "Low Match";
}

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

    const resumesWithAlignment =
      resumes.map((resume) => {
        const latestAnalysis =
          resume.analyses?.length
            ? [...resume.analyses].sort(
                (a, b) =>
                  new Date(b.createdAt) -
                  new Date(a.createdAt)
              )[0]
            : null;

        const careerAlignment =
          getCareerAlignment(
            resume.predictedCategory,
            resume.targetRole ||
              latestAnalysis?.targetRole,
            latestAnalysis?.jobMatch
          );

        return {
          ...resume,
          careerAlignment,
        };
      });

    res.json({
      success: true,

      count:
        resumesWithAlignment.length,

      resumes:
        resumesWithAlignment,
    });

  } catch (error) {
    console.error(
      "Failed to fetch resumes:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch resumes",
    });
  }
};