import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import prisma from "../config/prisma.js";
import { analyzeResume } from "../services/geminiService.js";
import {
  predictResumeCategory,
} from "../services/mlService.js";

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

async function extractPdfText(filePath) {
  const data = new Uint8Array(
    fs.readFileSync(filePath)
  );

  const loadingTask =
    pdfjsLib.getDocument({
      data,
      useWorkerFetch: false,
      isEvalSupported: false,
    });

  const pdfDocument =
    await loadingTask.promise;

  let text = "";

  for (
    let pageNumber = 1;
    pageNumber <= pdfDocument.numPages;
    pageNumber++
  ) {
    const page =
      await pdfDocument.getPage(
        pageNumber
      );

    const content =
      await page.getTextContent();

    const pageText =
      content.items
        .map((item) => item.str)
        .join(" ");

    text += pageText + "\n";
  }

  return text.trim();
}

export const uploadResume = async (
  req,
  res
) => {
  let createdResume = null;

  try {
    // ---------------------------------------
    // 1. Validate uploaded PDF
    // ---------------------------------------
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload a PDF resume.",
      });
    }

    // ---------------------------------------
    // 2. Get target job role
    // ---------------------------------------
    const targetRole =
      req.body.targetRole?.trim();

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter the job role you are targeting.",
      });
    }

    console.log(
      `Target role: ${targetRole}`
    );

    // ---------------------------------------
    // 3. Save resume in database
    // ---------------------------------------
    createdResume =
      await prisma.resume.create({
        data: {
          title:
            req.file.originalname,

          originalName:
            req.file.originalname,

          fileUrl:
            `/uploads/${req.file.filename}`,

          targetRole,

          aiStatus:
            "Analyzing",
        },
      });

    // ---------------------------------------
    // 4. Extract text from PDF
    // ---------------------------------------
    const resumeText =
      await extractPdfText(
        req.file.path
      );

    if (!resumeText) {
      throw new Error(
        "Could not extract text from the PDF."
      );
    }

    console.log(
      "PDF text extracted successfully."
    );

    // ---------------------------------------
    // 5. Predict resume category using ML
    // ---------------------------------------
    const predictedCategory =
      await predictResumeCategory(
        resumeText
      );

    console.log(
      `ML predicted category: ${predictedCategory}`
    );

    // ---------------------------------------
    // 6. Send resume + target role to Gemini
    // ---------------------------------------
    const aiResult =
      await analyzeResume(
        resumeText,
        targetRole
      );

    console.log(
      "Gemini analysis completed."
    );

    // ---------------------------------------
    // 7. Calculate career alignment
    // ---------------------------------------
    const finalTargetRole =
      aiResult.targetRole ||
      targetRole;

    const careerAlignment =
      getCareerAlignment(
        predictedCategory,
        finalTargetRole,
        aiResult.jobMatch
      );

    console.log(
      `Career alignment: ${careerAlignment}`
    );

    // ---------------------------------------
    // 8. Save complete AI analysis
    // ---------------------------------------
    const analysis =
      await prisma.analysis.create({
        data: {
          targetRole:
            finalTargetRole,

          overallScore:
            aiResult.overallScore,

          jobMatch:
            aiResult.jobMatch,

          keywordMatch:
            aiResult.keywordMatch,

          technicalSkills:
            aiResult.technicalSkills,

          experienceRelevance:
            aiResult.experienceRelevance,

          projectRelevance:
            aiResult.projectRelevance,

          resumeStructure:
            aiResult.resumeStructure,

          strengths:
            aiResult.strengths,

          weaknesses:
            aiResult.weaknesses,

          missingKeywords:
            aiResult.missingKeywords,

          suggestions:
            aiResult.suggestions,

          resumeId:
            createdResume.id,
        },
      });

    // ---------------------------------------
    // 9. Update resume with AI + ML results
    // ---------------------------------------
    const updatedResume =
      await prisma.resume.update({
        where: {
          id: createdResume.id,
        },

        data: {
          targetRole:
            finalTargetRole,

          atsScore:
            aiResult.overallScore,

          aiStatus:
            "Analyzed",

          predictedCategory,
        },
      });

    console.log(
      `Resume analyzed successfully. ATS Score: ${aiResult.overallScore}`
    );

    console.log(
      `ML predicted category saved: ${predictedCategory}`
    );

    // ---------------------------------------
    // 10. Return result
    // ---------------------------------------
    return res.status(201).json({
      success: true,

      message:
        "Resume analyzed successfully.",

      resume:
        updatedResume,

      analysis,

      careerAlignment,
    });

  } catch (error) {
    console.error(
      "Resume analysis error:",
      error
    );

    // ---------------------------------------
    // 11. Cleanup incomplete database record
    // ---------------------------------------
    if (createdResume) {
      try {
        await prisma.resume.delete({
          where: {
            id: createdResume.id,
          },
        });

        console.log(
          "Incomplete resume record cleaned up."
        );

      } catch (cleanupError) {
        console.error(
          "Failed to clean up incomplete resume:",
          cleanupError
        );
      }
    }

    // ---------------------------------------
    // 12. Return error
    // ---------------------------------------
    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Resume analysis failed.",
    });
  }
};