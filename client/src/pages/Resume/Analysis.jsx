import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  KeyRound,
  Lightbulb,
  Loader2,
  Target,
  TrendingUp,
  CalendarDays,
  Award,
  BarChart3,
  ClipboardCheck,
  Gauge,
  Code2,
  Layers3,
  FolderKanban,
  LayoutList,
  Download,
  Sparkles,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { jsPDF } from "jspdf";

import api from "../../services/api";

function clampScore(value) {
  return Math.min(Math.max(Number(value) || 0, 0), 100);
}

function getScoreStatus(score) {
  const value = clampScore(score);

  if (value >= 80) {
    return {
      label: "Excellent",
      description: "Strong performance with only minor improvements needed.",
      className: "text-emerald-400",
      dot: "bg-emerald-400",
      gradient: "from-emerald-400 to-cyan-400",
    };
  }

  if (value >= 60) {
    return {
      label: "Good",
      description: "A solid foundation, but some improvements are recommended.",
      className: "text-yellow-400",
      dot: "bg-yellow-400",
      gradient: "from-violet-500 to-cyan-400",
    };
  }

  return {
    label: "Needs Improvement",
    description: "Several important areas should be strengthened.",
    className: "text-red-400",
    dot: "bg-red-400",
    gradient: "from-red-500 to-orange-400",
  };
}

function cleanListItem(item) {
  return String(item)
    .replace(/^[\s•\-–—*]+/, "")
    .replace(/^\d+[\s.)-]+/, "")
    .trim();
}

function toItems(content) {
  if (!content) return [];

  const items = String(content)
    .split(/\r?\n|;|\s•\s/)
    .map(cleanListItem)
    .filter(Boolean);

  return items.length ? items : [String(content).trim()];
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

function getCareerAlignmentStyle(alignment) {
  const value = String(alignment || "").toLowerCase();

  if (value.includes("strong")) {
    return {
      label: "Strong Match",
      className: "text-emerald-300",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/20",
      description:
        "The predicted career category aligns well with the selected target role.",
    };
  }

  if (value.includes("moderate")) {
    return {
      label: "Moderate Match",
      className: "text-yellow-300",
      bgClass: "bg-yellow-500/10",
      borderClass: "border-yellow-500/20",
      description:
        "The predicted career category has some alignment with the selected target role.",
    };
  }

  return {
    label: "Low Match",
    className: "text-red-300",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
    description:
      "The predicted career category has limited alignment with the selected target role.",
  };
}

function getCareerAlignment(predictedCategory, targetRole) {
  const category = String(predictedCategory || "").toLowerCase().trim();
  const role = String(targetRole || "").toLowerCase().trim();

  if (!category || !role) return null;

  const categoryKeywords = {
    "information-technology": [
      "software", "developer", "engineer", "programmer", "frontend",
      "backend", "full stack", "fullstack", "web", "mobile", "devops",
      "data scientist", "machine learning", "ai", "cyber", "cloud",
      "network", "database", "technical", "it"
    ],
    "engineering": [
      "engineer", "engineering", "mechanical", "civil", "electrical",
      "electronics", "automotive", "production", "manufacturing"
    ],
    "banking": [
      "bank", "banking", "finance", "financial", "credit", "loan",
      "investment", "accountant", "accounting", "risk"
    ],
    "teacher": [
      "teacher", "teaching", "education", "educator", "professor",
      "lecturer", "trainer", "academic"
    ],
    "aviation": [
      "aviation", "pilot", "airline", "airport", "flight", "cabin",
      "aerospace", "aircraft"
    ],
    "consultant": [
      "consultant", "consulting", "business analyst", "strategy",
      "management", "advisor", "advisory"
    ],
    "chef": [
      "chef", "culinary", "cook", "kitchen", "restaurant", "food"
    ],
  };

  const keywords = categoryKeywords[category] || [];
  const directCategoryMatch =
    role.includes(category.replace(/-/g, " ")) ||
    category.split("-").some((part) => part.length > 2 && role.includes(part));

  const matchedKeywords = keywords.filter((keyword) => role.includes(keyword));

  if (directCategoryMatch || matchedKeywords.length >= 2) return "Strong Match";
  if (matchedKeywords.length === 1) return "Moderate Match";
  return "Low Match";
}

/* =========================================================
   PDF REPORT
========================================================= */
function downloadAnalysisReport({ resume, analysis, scores }) {
  if (!resume || !analysis) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const violet = [124, 58, 237];
  const cyan = [6, 182, 212];
  const green = [16, 185, 129];
  const amber = [234, 179, 8];
  const dark = [15, 23, 42];
  const gray = [100, 116, 139];

  const safeText = (value) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();

  const addPageIfNeeded = (needed = 15) => {
    if (y + needed > pageHeight - 18) {
      doc.addPage();
      y = 20;
    }
  };

  const addWrappedText = (
    value,
    x,
    startY,
    width,
    fontSize = 10,
    color = dark,
    lineHeight = 5
  ) => {
    const content = safeText(value);
    if (!content) return startY;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(content, width);

    lines.forEach((line) => {
      addPageIfNeeded(lineHeight);
      doc.text(line, x, startY);
      startY += lineHeight;
    });

    return startY;
  };

  const addSectionTitle = (title, color = violet) => {
    addPageIfNeeded(20);

    doc.setFillColor(...color);
    doc.roundedRect(margin, y - 5, 3, 9, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...dark);
    doc.text(title, margin + 7, y + 2);

    y += 12;
  };

  const addBulletSection = (title, items, color = violet) => {
    addSectionTitle(title, color);

    const safeItems = items?.length ? items : ["No information available."];

    safeItems.forEach((item, index) => {
      addPageIfNeeded(18);

      doc.setFillColor(...color);
      doc.circle(margin + 2.5, y - 1.5, 1.5, "F");

      y = addWrappedText(
        item,
        margin + 8,
        y,
        contentWidth - 8,
        10,
        dark,
        5
      );

      y += 3;
    });

    y += 3;
  };

  const detailScores = [
    ["Keyword Match", scores.keywordMatch],
    ["Technical Skills", scores.technicalSkills],
    ["Experience Relevance", scores.experienceRelevance],
    ["Project Relevance", scores.projectRelevance],
    ["Resume Structure", scores.resumeStructure],
  ];

  // Header
  doc.setFillColor(...violet);
  doc.roundedRect(margin, y - 7, 11, 11, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...dark);
  doc.text("Hire", margin + 15, y + 1);

  doc.setTextColor(...violet);
  doc.text("Sense", margin + 31, y + 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text("AI RESUME ANALYSIS REPORT", margin, y + 10);

  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...dark);

  y = addWrappedText(
    resume.originalName || "Resume",
    margin,
    y,
    contentWidth,
    18,
    dark,
    7
  );

  y += 3;

  y = addWrappedText(
    `Target Role: ${resume.targetRole || "Not specified"}`,
    margin,
    y,
    contentWidth,
    10,
    gray,
    5
  );

  y += 8;

  // Main score boxes
  const boxGap = 6;
  const boxWidth = (contentWidth - boxGap) / 2;
  const boxHeight = 34;

  addPageIfNeeded(boxHeight + 8);

  doc.setFillColor(245, 243, 255);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 4, 4, "F");

  doc.setFillColor(236, 254, 255);
  doc.roundedRect(
    margin + boxWidth + boxGap,
    y,
    boxWidth,
    boxHeight,
    4,
    4,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text("OVERALL ATS SCORE", margin + 6, y + 9);
  doc.text(
    "TARGET ROLE MATCH",
    margin + boxWidth + boxGap + 6,
    y + 9
  );

  doc.setFontSize(24);
  doc.setTextColor(...violet);
  doc.text(String(scores.overallScore), margin + 6, y + 24);

  doc.setTextColor(...cyan);
  doc.text(
    String(scores.jobMatch),
    margin + boxWidth + boxGap + 6,
    y + 24
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text("/ 100", margin + 25, y + 24);
  doc.text("%", margin + boxWidth + boxGap + 25, y + 24);

  y += boxHeight + 13;

  // Detailed score breakdown
  addSectionTitle("Detailed ATS Breakdown", violet);

  detailScores.forEach(([label, value]) => {
    addPageIfNeeded(15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...cyan);
    doc.text(`${value}%`, pageWidth - margin, y, { align: "right" });

    y += 3;

    doc.setFillColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 3, 1.5, 1.5, "F");

    doc.setFillColor(...cyan);
    doc.roundedRect(
      margin,
      y,
      (contentWidth * value) / 100,
      3,
      1.5,
      1.5,
      "F"
    );

    y += 10;
  });

  y += 3;

  addBulletSection("Strengths", toItems(analysis.strengths), green);
  addBulletSection(
    "Weaknesses",
    toItems(analysis.weaknesses),
    [239, 68, 68]
  );
  addBulletSection(
    "Missing Keywords",
    toItems(analysis.missingKeywords),
    amber
  );
  addBulletSection("AI Suggestions", toItems(analysis.suggestions), violet);

  addSectionTitle("Next Steps", violet);

  y = addWrappedText(
    "Use the recommendations above to improve ATS performance and strengthen suitability for the selected target role.",
    margin,
    y,
    contentWidth,
    10,
    dark,
    5
  );

  y += 8;

  addSectionTitle("Resume Information", cyan);

  const info = [
    ["File Name", resume.originalName || "Not specified"],
    ["Target Role", resume.targetRole || "Not specified"],
    ["ML Predicted Category", resume.predictedCategory || "Not available"],
    ["Career Alignment", getCareerAlignment(resume.predictedCategory, resume.targetRole) || "Not available"],
    ["Uploaded On", formatDate(resume.uploadedAt)],
  ];

  info.forEach(([label, value]) => {
    addPageIfNeeded(14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(label, margin, y);

    y += 5;

    y = addWrappedText(
      value,
      margin,
      y,
      contentWidth,
      10,
      dark,
      5
    );

    y += 5;
  });

  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);

    doc.setDrawColor(226, 232, 240);
    doc.line(
      margin,
      pageHeight - 14,
      pageWidth - margin,
      pageHeight - 14
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...gray);

    doc.text(
      "Generated by HireSense • AI Resume Intelligence",
      margin,
      pageHeight - 8
    );

    doc.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    );
  }

  const safeFileName = String(resume.originalName || "resume")
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9-_]+/gi, "_")
    .replace(/^_+|_+$/g, "");

  doc.save(
    `${safeFileName || "resume"}_HireSense_Analysis.pdf`
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */
export default function Analysis() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [resume, setResume] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchAnalysis() {
    try {
      setLoading(true);

      // No authentication required.
      const response = await api.get("/resume");
      const resumes = response.data.resumes || [];

      const selectedResume = resumes.find(
        (item) => item.id === id
      );

      if (!selectedResume) {
        toast.error("Resume not found.");
        navigate("/");
        return;
      }

      setResume(selectedResume);

      const analyses = selectedResume.analyses || [];

      if (analyses.length > 0) {
        setAnalysis(
          analyses[analyses.length - 1]
        );
      } else {
        setAnalysis(null);
      }
    } catch (error) {
      console.error("Analysis fetch error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load resume analysis."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const scores = useMemo(
    () => ({
      overallScore: clampScore(analysis?.overallScore),
      jobMatch: clampScore(analysis?.jobMatch),
      keywordMatch: clampScore(analysis?.keywordMatch),
      technicalSkills: clampScore(analysis?.technicalSkills),
      experienceRelevance: clampScore(
        analysis?.experienceRelevance
      ),
      projectRelevance: clampScore(
        analysis?.projectRelevance
      ),
      resumeStructure: clampScore(
        analysis?.resumeStructure
      ),
    }),
    [analysis]
  );

  const overallStatus = getScoreStatus(
    scores.overallScore
  );
  const matchStatus = getScoreStatus(scores.jobMatch);

  const careerAlignment = useMemo(
    () =>
      getCareerAlignment(
        resume?.predictedCategory,
        resume?.targetRole
      ),
    [resume?.predictedCategory, resume?.targetRole]
  );

  const scoreGap = Math.round(
    Math.abs(scores.overallScore - scores.jobMatch)
  );

  const strengthItems = useMemo(
    () => toItems(analysis?.strengths),
    [analysis?.strengths]
  );

  const weaknessItems = useMemo(
    () => toItems(analysis?.weaknesses),
    [analysis?.weaknesses]
  );

  const keywordItems = useMemo(
    () => toItems(analysis?.missingKeywords),
    [analysis?.missingKeywords]
  );

  const suggestionItems = useMemo(
    () => toItems(analysis?.suggestions),
    [analysis?.suggestions]
  );

  const detailedScores = useMemo(
    () => [
      {
        label: "Keyword Match",
        value: scores.keywordMatch,
        icon: <KeyRound size={20} />,
        iconClass: "text-yellow-400",
        gradient: "from-yellow-400 to-orange-400",
        description:
          "Relevant ATS keywords and terminology found in the resume.",
      },
      {
        label: "Technical Skills",
        value: scores.technicalSkills,
        icon: <Code2 size={20} />,
        iconClass: "text-cyan-400",
        gradient: "from-cyan-400 to-blue-500",
        description:
          "Technical skills demonstrated against the target role.",
      },
      {
        label: "Experience Relevance",
        value: scores.experienceRelevance,
        icon: <Briefcase size={20} />,
        iconClass: "text-violet-400",
        gradient: "from-violet-500 to-fuchsia-400",
        description:
          "How closely the demonstrated experience supports the target role.",
      },
      {
        label: "Project Relevance",
        value: scores.projectRelevance,
        icon: <FolderKanban size={20} />,
        iconClass: "text-emerald-400",
        gradient: "from-emerald-400 to-teal-400",
        description:
          "Relevance of listed projects to the selected role.",
      },
      {
        label: "Resume Structure",
        value: scores.resumeStructure,
        icon: <LayoutList size={20} />,
        iconClass: "text-blue-400",
        gradient: "from-blue-400 to-indigo-500",
        description:
          "Organization, readability, section structure, and ATS-friendly presentation.",
      },
    ],
    [scores]
  );

  const detailAverage = Math.round(
    detailedScores.reduce(
      (sum, item) => sum + item.value,
      0
    ) / detailedScores.length
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            size={42}
            className="text-violet-500 animate-spin"
          />
          <p className="text-zinc-400">
            Loading AI analysis...
          </p>
        </div>
      </div>
    );
  }

  if (!resume) return null;

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden">
      <Toaster position="top-right" />

      {/* Ambient background */}
      <div className="pointer-events-none fixed -top-48 -left-48 w-[600px] h-[600px] rounded-full bg-violet-700/15 blur-[180px]" />
      <div className="pointer-events-none fixed -bottom-48 -right-48 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[180px]" />
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[180px]" />

      {/* Navbar */}
      <nav className="relative z-10 h-20 border-b border-white/10 backdrop-blur-xl flex items-center justify-between px-5 md:px-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-600/25 transition">
            <Target
              size={20}
              className="text-violet-400"
            />
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Hire<span className="text-violet-500">Sense</span>
          </h1>
        </button>

        <div className="flex items-center gap-2">
          {analysis && (
            <button
              onClick={() =>
                downloadAnalysisReport({
                  resume,
                  analysis,
                  scores,
                })
              }
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-900/20 transition"
            >
              <Download size={17} />
              Download Report
            </button>
          )}

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 md:px-5 py-2.5 rounded-xl transition"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">
              Dashboard
            </span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 shrink-0">
                <FileText
                  size={34}
                  className="text-violet-400"
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-semibold">
                  AI Resume Intelligence
                </p>

                <h2 className="text-3xl md:text-4xl font-black mt-1">
                  Resume Analysis
                </h2>

                <p className="text-zinc-500 mt-1 truncate max-w-2xl">
                  {resume.originalName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm font-medium">
                <CheckCircle size={16} />
                <span>AI analysis complete</span>
              </div>

              {analysis && (
                <button
                  onClick={() =>
                    downloadAnalysisReport({
                      resume,
                      analysis,
                      scores,
                    })
                  }
                  className="sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 transition"
                >
                  <Download size={17} />
                  PDF
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Target Role */}
        {resume.targetRole && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-7 relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-white/[0.03] to-cyan-500/5 p-5 md:p-6"
          >
            <div className="absolute -right-16 -top-20 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Briefcase
                  size={23}
                  className="text-violet-400"
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                  Analysis performed for
                </p>

                <h3 className="text-xl md:text-2xl font-bold text-white mt-1 break-words">
                  {resume.targetRole}
                </h3>
              </div>
            </div>
          </motion.div>
        )}

        {/* ML Career Prediction + Career Alignment */}
        {resume.predictedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4 relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.08] via-white/[0.025] to-indigo-500/[0.06] p-5 md:p-6"
          >
            <div className="absolute -right-20 -top-24 w-52 h-52 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-violet-400 shrink-0" />
                    <p className="text-sm uppercase tracking-wider text-zinc-500 font-semibold">
                      ML Career Prediction
                    </p>
                  </div>

                  <p className="text-xs uppercase tracking-wider text-zinc-600 font-medium mt-4">
                    Predicted Category
                  </p>

                  <h3 className="text-xl md:text-2xl font-black text-violet-300 mt-1 break-words">
                    {resume.predictedCategory}
                  </h3>


                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 shrink-0">

                  {resume.targetRole && (
                    <span className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold">
                      Target: {resume.targetRole}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-white/10">
                {(() => {
                  const alignment = getCareerAlignmentStyle(
                    careerAlignment
                  );

                  return (
                    <div
                      className={`rounded-xl border ${alignment.borderClass} ${alignment.bgClass} p-4`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg ${alignment.bgClass} border ${alignment.borderClass} flex items-center justify-center`}
                          >
                            <Target size={19} className={alignment.className} />
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                              Career Alignment
                            </p>

                            <p
                              className={`text-lg font-black mt-0.5 ${alignment.className}`}
                            >
                              {careerAlignment || "Not available"}
                            </p>
                          </div>
                        </div>

                        <div className="text-sm text-zinc-400 sm:text-right max-w-xl">
                          {alignment.description}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}

        {!analysis && (
          <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
            <AlertTriangle
              size={50}
              className="mx-auto text-yellow-400"
            />

            <h3 className="text-2xl font-bold mt-5">
              Analysis Not Available
            </h3>

            <p className="text-zinc-500 mt-2">
              This resume has not been analyzed yet.
            </p>
          </div>
        )}

        {analysis && (
          <>
            {/* Main scores */}
            <div className="grid lg:grid-cols-2 gap-6 mt-7">
              <ScoreCard
                title="Overall ATS Score"
                score={scores.overallScore}
                status={overallStatus}
                icon={<CheckCircle size={28} />}
                iconClass="text-emerald-400"
                gradient="from-violet-500 to-emerald-400"
                suffix="/ 100"
                delay={0.15}
              />

              <ScoreCard
                title="Role Match"
                score={scores.jobMatch}
                status={matchStatus}
                icon={<Briefcase size={28} />}
                iconClass="text-cyan-400"
                gradient="from-cyan-500 to-blue-500"
                suffix="%"
                subtitle={
                  <>
                    Match for{" "}
                    <span className="text-cyan-300 font-medium">
                      {resume.targetRole || "Target Role"}
                    </span>
                  </>
                }
                delay={0.2}
              />
            </div>

            {/* Performance snapshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] overflow-hidden"
            >
              <div className="p-5 md:p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <BarChart3
                    size={22}
                    className="text-violet-400"
                  />

                  <div>
                    <h3 className="font-bold text-lg">
                      Performance Snapshot
                    </h3>
                    <p className="text-sm text-zinc-500">
                      A quick view of overall ATS quality and target-role fit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 p-5 md:p-6">
                <ScoreBar
                  label="Overall ATS quality"
                  value={scores.overallScore}
                  gradient="from-violet-500 to-emerald-400"
                />

                <ScoreBar
                  label="Target-role fit"
                  value={scores.jobMatch}
                  gradient="from-cyan-500 to-blue-500"
                />
              </div>

              <div className="px-5 pb-5 md:px-6 md:pb-6">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp
                      size={19}
                      className="text-violet-400"
                    />
                  </div>

                  <p className="text-sm text-zinc-400 leading-6">
                    {scores.overallScore === scores.jobMatch
                      ? "Overall ATS quality and target-role fit are currently aligned."
                      : scores.overallScore > scores.jobMatch
                      ? `The resume's overall ATS quality is ${scoreGap} point${scoreGap === 1 ? "" : "s"} higher than its target-role fit. Strengthen role-specific evidence to close the gap.`
                      : `The target-role fit is ${scoreGap} point${scoreGap === 1 ? "" : "s"} higher than the overall ATS quality. Improving structure and ATS optimization can strengthen the resume further.`}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* NEW: Detailed ATS Breakdown */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-7 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.02] overflow-hidden"
            >
              <div className="p-5 md:p-7 border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <Gauge
                        size={22}
                        className="text-violet-400"
                      />
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-violet-400 font-semibold">
                        ATS Diagnostics
                      </p>

                      <h3 className="text-2xl font-bold mt-1">
                        Detailed ATS Breakdown
                      </h3>

                      <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
                        See exactly which resume dimensions are helping or limiting your ATS and role-match performance.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-xl border border-white/10 bg-black/20 px-5 py-3">
                    <p className="text-xs text-zinc-500">
                      Detailed score average
                    </p>
                    <p className="text-2xl font-black text-cyan-400">
                      {detailAverage}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-7 grid md:grid-cols-2 gap-4">
                {detailedScores.map((item, index) => (
                  <DetailedScoreCard
                    key={item.label}
                    {...item}
                    delay={0.05 * index}
                  />
                ))}
              </div>
            </motion.section>

            {/* Status summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex items-center gap-3">
                  <Award
                    size={22}
                    className="text-violet-400"
                  />

                  <div>
                    <p className="text-sm text-zinc-500">
                      Overall assessment
                    </p>

                    <p
                      className={`font-bold ${overallStatus.className}`}
                    >
                      {overallStatus.label}
                    </p>
                  </div>
                </div>

                <div className="hidden md:block w-px h-10 bg-white/10" />

                <div className="flex items-center gap-3">
                  <Target
                    size={22}
                    className="text-cyan-400"
                  />

                  <div>
                    <p className="text-sm text-zinc-500">
                      Target-role fit
                    </p>

                    <p
                      className={`font-bold ${matchStatus.className}`}
                    >
                      {matchStatus.label}
                    </p>
                  </div>
                </div>

                <p className="md:ml-auto text-sm text-zinc-500 max-w-md md:text-right">
                  {matchStatus.description}
                </p>
              </div>
            </motion.div>

            {/* AI analysis */}
            <div className="grid lg:grid-cols-2 gap-6 mt-8">
              <AnalysisCard
                icon={<CheckCircle size={28} />}
                iconClass="text-emerald-400"
                title="Strengths"
                description="What your resume already does well."
                items={strengthItems}
                numberClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              />

              <AnalysisCard
                icon={<AlertTriangle size={28} />}
                iconClass="text-red-400"
                title="Weaknesses"
                description="Areas that may reduce ATS or role fit."
                items={weaknessItems}
                numberClass="bg-red-500/10 text-red-400 border-red-500/20"
              />

              <AnalysisCard
                icon={<KeyRound size={28} />}
                iconClass="text-yellow-400"
                title="Missing Keywords"
                description="Relevant terms worth considering for this role."
                items={keywordItems}
                numberClass="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                compact
              />

              <AnalysisCard
                icon={<Lightbulb size={28} />}
                iconClass="text-violet-400"
                title="AI Suggestions"
                description="Practical improvements based on this analysis."
                items={suggestionItems}
                numberClass="bg-violet-500/10 text-violet-400 border-violet-500/20"
              />
            </div>

            {/* Action plan */}
            {suggestionItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-7 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.07] to-cyan-500/[0.04] p-6 md:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <ClipboardCheck
                      size={22}
                      className="text-violet-400"
                    />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-violet-400 font-semibold">
                      Next steps
                    </p>

                    <h3 className="text-2xl font-bold mt-1">
                      Improve your resume
                    </h3>

                    <p className="text-sm text-zinc-500 mt-1">
                      Start with the recommendations generated for this target role.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 mt-6">
                  {suggestionItems
                    .slice(0, 6)
                    .map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4"
                      >
                        <span className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <p className="text-sm text-zinc-300 leading-6">
                          {item}
                        </p>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Resume information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-7 rounded-2xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
            >
              <div className="flex items-center gap-3">
                <FileText
                  size={23}
                  className="text-violet-400"
                />

                <h3 className="text-2xl font-bold">
                  Resume Information
                </h3>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">
                <InfoBox
                  label="File Name"
                  value={resume.originalName}
                />

                <InfoBox
                  label="Target Role"
                  value={resume.targetRole || "Not specified"}
                  valueClass="text-violet-300"
                />

                <InfoBox
                  label="ML Predicted Category"
                  value={resume.predictedCategory || "Not available"}
                  valueClass="text-cyan-300"
                />

                <InfoBox
                  label="Career Alignment"
                  value={careerAlignment || "Not available"}
                  valueClass={
                    String(careerAlignment || "")
                      .toLowerCase()
                      .includes("strong")
                      ? "text-emerald-300"
                      : String(careerAlignment || "")
                          .toLowerCase()
                          .includes("moderate")
                      ? "text-yellow-300"
                      : "text-red-300"
                  }
                />

                <div className="bg-black/20 rounded-xl p-5 md:col-span-2 xl:col-span-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-zinc-500">
                      Uploaded On
                    </p>

                    <CalendarDays size={15} className="text-zinc-500" />
                  </div>

                  <p className="font-semibold mt-2">
                    {formatDate(resume.uploadedAt)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Bottom report CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-7 mb-4 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/[0.12] via-white/[0.025] to-cyan-500/[0.08] p-6 md:p-7"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-400 font-semibold">
                    Ready to improve?
                  </p>

                  <h3 className="text-2xl font-bold mt-1">
                    Take your analysis with you
                  </h3>

                  <p className="text-sm text-zinc-500 mt-1">
                    Download the complete HireSense analysis report as a PDF.
                  </p>
                </div>

                <button
                  onClick={() =>
                    downloadAnalysisReport({
                      resume,
                      analysis,
                      scores,
                    })
                  }
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition font-semibold shadow-lg shadow-violet-900/20"
                >
                  <Download size={18} />
                  Download Analysis Report
                </button>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}

/* =========================================================
   SCORE CARD
========================================================= */
function ScoreCard({
  title,
  score,
  status,
  icon,
  iconClass,
  gradient,
  suffix,
  subtitle,
  delay,
}) {
  const safeScore = clampScore(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative overflow-hidden bg-white/[0.045] border border-white/10 rounded-2xl p-7 md:p-8 hover:border-white/15 transition"
    >
      <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-white/[0.02] blur-3xl" />

      <div className="relative flex items-center gap-3">
        <div className={iconClass}>
          {icon}
        </div>

        <h3 className="text-lg text-zinc-400">
          {title}
        </h3>
      </div>

      {subtitle && (
        <p className="relative text-sm text-zinc-500 mt-2">
          {subtitle}
        </p>
      )}

      <div className="relative flex items-center gap-6 mt-6">
        <div
          className="w-28 h-28 md:w-32 md:h-32 rounded-full p-[7px] shrink-0"
          style={{
            background: `conic-gradient(from 210deg, ${safeScore > 0 ? "rgb(124,58,237)" : "rgba(255,255,255,0.06)"} ${safeScore * 3.6}deg, rgba(255,255,255,0.06) ${safeScore * 3.6}deg)`,
          }}
        >
          <div className="w-full h-full rounded-full bg-[#090d18] flex items-center justify-center border border-white/5">
            <div className="text-center">
              <div
                className={`text-3xl md:text-4xl font-black ${status.className}`}
              >
                {safeScore}
              </div>

              <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                score
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-end gap-2">
            <span
              className={`text-5xl md:text-6xl font-black tracking-tight ${status.className}`}
            >
              {safeScore}
            </span>

            <span className="text-xl text-zinc-500 mb-1">
              {suffix}
            </span>
          </div>

          <p
            className={`text-sm font-semibold mt-1 ${status.className}`}
          >
            {status.label}
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-between mt-6">
        <span className="text-xs text-zinc-600">
          Score out of 100
        </span>

        <span className="text-xs text-zinc-500">
          {safeScore}%
        </span>
      </div>

      <div className="relative w-full h-2.5 bg-zinc-900/80 rounded-full mt-2.5 overflow-hidden border border-white/5">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </motion.div>
  );
}

/* =========================================================
   SCORE BAR
========================================================= */
function ScoreBar({ label, value, gradient }) {
  const safeValue = clampScore(value);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-zinc-400">
          {label}
        </span>

        <span className="text-sm font-bold text-white">
          {safeValue}%
        </span>
      </div>

      <div className="w-full h-2.5 bg-zinc-900/80 rounded-full mt-3 overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeValue}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
        />
      </div>
    </div>
  );
}

/* =========================================================
   DETAILED SCORE CARD
========================================================= */
function DetailedScoreCard({
  label,
  value,
  icon,
  iconClass,
  gradient,
  description,
  delay,
}) {
  const safeValue = clampScore(value);
  const status = getScoreStatus(safeValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/[0.035] hover:border-white/15 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 ${iconClass}`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <h4 className="font-bold text-white">
              {label}
            </h4>

            <p className="text-xs text-zinc-500 mt-1 leading-5">
              {description}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className={`text-2xl font-black ${status.className}`}>
            {safeValue}%
          </p>
          <p className={`text-[11px] font-semibold ${status.className}`}>
            {status.label}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-zinc-600">
            Score
          </span>
          <span className="text-xs text-zinc-500">
            {safeValue} / 100
          </span>
        </div>

        <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${safeValue}%` }}
            transition={{ duration: 0.8, delay: delay + 0.15 }}
            className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   ANALYSIS CARD
========================================================= */
function AnalysisCard({
  icon,
  iconClass,
  title,
  description,
  items,
  numberClass,
  compact = false,
}) {
  const safeItems = items?.length
    ? items
    : ["No information available."];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/[0.035] border border-white/10 rounded-2xl p-7 md:p-8 hover:border-white/15 transition"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${iconClass}`}>
          {icon}
        </div>

        <div>
          <h3 className="text-2xl font-bold">
            {title}
          </h3>

          <p className="text-sm text-zinc-600 mt-1">
            {description}
          </p>
        </div>
      </div>

      <div
        className={`mt-6 ${
          compact
            ? "flex flex-wrap gap-2"
            : "space-y-3"
        }`}
      >
        {safeItems.map((item, index) =>
          compact ? (
            <span
              key={`${item}-${index}`}
              className="px-3.5 py-2 rounded-full bg-yellow-500/5 border border-yellow-500/15 text-sm text-zinc-300"
            >
              {item}
            </span>
          ) : (
            <div
              key={`${item}-${index}`}
              className="flex items-start gap-3 rounded-xl bg-black/20 border border-white/5 p-4"
            >
              <span
                className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${numberClass}`}
              >
                {index + 1}
              </span>

              <p className="text-zinc-300 leading-7 text-[15px]">
                {item}
              </p>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}

/* =========================================================
   INFORMATION BOX
========================================================= */
function InfoBox({
  label,
  value,
  valueClass = "text-white",
}) {
  return (
    <div className="bg-black/20 rounded-xl p-5">
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p
        className={`font-semibold mt-2 break-all ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}