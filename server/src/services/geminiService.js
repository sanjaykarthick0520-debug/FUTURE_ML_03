import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/* =========================================================
   GEMINI REQUEST HELPER
   ========================================================= */

async function generateWithRetry(prompt) {
  const MAX_RETRIES = 3;

  let response;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `Gemini request attempt ${attempt}/${MAX_RETRIES}...`
      );

      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      break;
    } catch (error) {
      const status =
        error?.status ||
        error?.error?.code;

      const isTemporaryError =
        status === 503 ||
        status === 429 ||
        status === 500;

      if (
        !isTemporaryError ||
        attempt === MAX_RETRIES
      ) {
        throw error;
      }

      const delay = attempt * 2000;

      console.log(
        `Gemini temporarily unavailable. Retrying in ${
          delay / 1000
        } seconds...`
      );

      await sleep(delay);
    }
  }

  const text = response?.text?.trim();

  if (!text) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return text;
}


/* =========================================================
   JSON CLEANER
   ========================================================= */

function cleanJsonResponse(text) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}


/* =========================================================
   EXISTING RESUME ANALYSIS
   DO NOT REMOVE / DO NOT CHANGE THE BEHAVIOUR
   ========================================================= */

export async function analyzeResume(
  resumeText,
  targetRole
) {
  if (!targetRole || !targetRole.trim()) {
    throw new Error(
      "Target job role is required."
    );
  }

  const role = targetRole.trim();

  const prompt = `
You are an expert ATS Resume Analyzer and career matching specialist.

Analyze the resume specifically for the target job role.

TARGET JOB ROLE:
${role}

Evaluate the resume based ONLY on information actually present in the resume.

Do not invent:

- Skills
- Technologies
- Projects
- Experience
- Certifications
- Education
- Achievements

Use your general knowledge only to determine which skills and qualifications
are relevant to the target role.

Return ONLY valid JSON.
Do not use markdown.
Do not add explanations outside the JSON.

Return EXACTLY this structure:

{
  "targetRole": "string",
  "overallScore": number,
  "jobMatch": number,
  "keywordMatch": number,
  "technicalSkills": number,
  "experienceRelevance": number,
  "projectRelevance": number,
  "resumeStructure": number,
  "strengths": "string",
  "weaknesses": "string",
  "missingKeywords": "string",
  "suggestions": "string"
}

SCORING RULES:

overallScore:
Overall ATS quality of the resume from 0 to 100.

jobMatch:
How strongly THIS resume matches THIS SPECIFIC target role from 0 to 100.

keywordMatch:
How well the resume contains relevant keywords for the target role from 0 to 100.

technicalSkills:
How well the demonstrated technical skills match the target role from 0 to 100.

experienceRelevance:
How relevant the candidate's demonstrated experience is to the target role from 0 to 100.

projectRelevance:
How relevant the candidate's demonstrated projects are to the target role from 0 to 100.

resumeStructure:
Quality of resume organization, readability, formatting, section structure,
and ATS-friendly presentation from 0 to 100.

IMPORTANT:

- All scores must be numbers between 0 and 100.
- Do not give every category the same score.
- Scores must be based on evidence in the resume.
- Do not assume missing information exists.
- targetRole must exactly match the role provided by the user.
- strengths must identify important strengths relevant to the target role.
- weaknesses must identify important weaknesses.
- missingKeywords must identify relevant missing or weakly represented
  keywords, technologies, skills, or qualifications.
- suggestions must provide practical improvements.
- Keep the text concise but useful.

RESUME:

${resumeText}
`;

  const text = await generateWithRetry(prompt);

  const cleanedText = cleanJsonResponse(text);

  try {
    const result = JSON.parse(cleanedText);

    const scoreFields = [
      "overallScore",
      "jobMatch",
      "keywordMatch",
      "technicalSkills",
      "experienceRelevance",
      "projectRelevance",
      "resumeStructure",
    ];

    for (const field of scoreFields) {
      if (
        typeof result[field] !== "number" ||
        result[field] < 0 ||
        result[field] > 100
      ) {
        throw new Error(
          `Invalid score returned for ${field}`
        );
      }
    }

    if (
      typeof result.targetRole !== "string" ||
      typeof result.strengths !== "string" ||
      typeof result.weaknesses !== "string" ||
      typeof result.missingKeywords !== "string" ||
      typeof result.suggestions !== "string"
    ) {
      throw new Error(
        "Gemini returned invalid analysis data."
      );
    }

    return result;
  } catch (error) {
    console.error(
      "Gemini raw response:"
    );

    console.error(text);

    throw new Error(
      "Gemini returned an invalid JSON response."
    );
  }
}


/* =========================================================
   NEW OPTIONAL FEATURE
   AI CANDIDATE RECOMMENDATION
   ========================================================= */

export async function generateCandidateRecommendation(
  candidates,
  targetRole = null
) {
  if (
    !Array.isArray(candidates) ||
    candidates.length === 0
  ) {
    throw new Error(
      "At least one candidate is required for AI recommendation."
    );
  }

  /*
    We intentionally send only the information required
    for comparison.

    We DO NOT send:
    - passwords
    - emails
    - user IDs
    - file paths
    - private database information
  */

  const candidateData = candidates.map(
    (candidate, index) => ({
      candidateNumber: index + 1,

      id: candidate.id,

      name:
        candidate.name ||
        candidate.originalName ||
        candidate.title ||
        `Candidate ${index + 1}`,

      targetRole:
        candidate.targetRole ||
        targetRole ||
        "Not specified",

      overallScore:
        Number(candidate.overallScore) || 0,

      jobMatch:
        Number(candidate.jobMatch) || 0,

      keywordMatch:
        candidate.keywordMatch != null
          ? Number(candidate.keywordMatch)
          : null,

      technicalSkills:
        candidate.technicalSkills != null
          ? Number(candidate.technicalSkills)
          : null,

      experienceRelevance:
        candidate.experienceRelevance != null
          ? Number(candidate.experienceRelevance)
          : null,

      projectRelevance:
        candidate.projectRelevance != null
          ? Number(candidate.projectRelevance)
          : null,

      resumeStructure:
        candidate.resumeStructure != null
          ? Number(candidate.resumeStructure)
          : null,

      strengths:
        candidate.strengths || "",

      weaknesses:
        candidate.weaknesses || "",

      missingKeywords:
        candidate.missingKeywords || "",
    })
  );

  const prompt = `
You are an expert technical recruiter and AI hiring assistant.

You are reviewing multiple candidates who have already been analyzed by
HireSense.

Your task is to recommend the strongest candidate among the candidates
provided below.

${targetRole ? `TARGET JOB ROLE:\n${targetRole}` : ""}

IMPORTANT RULES:

1. Use ONLY the information provided for each candidate.
2. Do NOT invent skills, experience, projects, education, certifications,
   achievements, or technologies.
3. Do NOT favor a candidate based on their name.
4. Do NOT use protected or unrelated personal characteristics.
5. Consider both overall ATS quality and suitability for the target role.
6. Consider strengths and weaknesses.
7. Consider technical skills, project relevance, experience relevance,
   and keyword match when those values are available.
8. A candidate with a slightly lower ATS score can still be recommended
   if their target-role fit is substantially stronger.
9. The recommendation must be explainable using the provided evidence.
10. If candidates are very close, clearly state that the difference is narrow.

CANDIDATE DATA:

${JSON.stringify(candidateData, null, 2)}

Return ONLY valid JSON.

Return EXACTLY this structure:

{
  "recommendedCandidateId": "string",
  "recommendedCandidateName": "string",
  "confidence": number,
  "summary": "string",
  "reasons": "string",
  "keyStrengths": "string",
  "potentialConcerns": "string",
  "hiringRecommendation": "string"
}

FIELD RULES:

recommendedCandidateId:
The exact id of the recommended candidate.

recommendedCandidateName:
The exact candidate name provided in the candidate data.

confidence:
A number between 0 and 100 representing how confident you are in the
recommendation based on the available evidence.

summary:
A concise explanation of why this candidate ranked highest.

reasons:
The most important evidence supporting the recommendation.

keyStrengths:
The candidate's strongest relevant qualities.

potentialConcerns:
Important weaknesses or limitations that a recruiter should consider.

hiringRecommendation:
A concise practical recommendation such as:
"Strongest candidate for the selected role."
or
"Recommended, but technical interview validation is advised."

Do not mention information that is not present in the candidate data.
`;

  const text = await generateWithRetry(prompt);

  const cleanedText = cleanJsonResponse(text);

  try {
    const result = JSON.parse(cleanedText);

    if (
      typeof result.recommendedCandidateId !==
        "string" ||
      typeof result.recommendedCandidateName !==
        "string" ||
      typeof result.confidence !== "number" ||
      typeof result.summary !== "string" ||
      typeof result.reasons !== "string" ||
      typeof result.keyStrengths !== "string" ||
      typeof result.potentialConcerns !==
        "string" ||
      typeof result.hiringRecommendation !==
        "string"
    ) {
      throw new Error(
        "Gemini returned invalid candidate recommendation data."
      );
    }

    if (
      result.confidence < 0 ||
      result.confidence > 100
    ) {
      throw new Error(
        "Invalid confidence score returned by Gemini."
      );
    }

    const candidateExists =
      candidateData.some(
        (candidate) =>
          candidate.id ===
          result.recommendedCandidateId
      );

    if (!candidateExists) {
      throw new Error(
        "Gemini recommended a candidate that was not included in the comparison."
      );
    }

    return result;
  } catch (error) {
    console.error(
      "Gemini candidate recommendation raw response:"
    );

    console.error(text);

    throw new Error(
      "Gemini returned an invalid candidate recommendation."
    );
  }
}