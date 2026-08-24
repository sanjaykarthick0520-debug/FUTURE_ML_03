import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import {
  Upload,
  FileText,
  BarChart3,
  ArrowRight,
  Trash2,
  ExternalLink,
  Download,
  Briefcase,
  Users,
  Sparkles,
  CheckCircle2,
  Search,
  RefreshCw,
  X,
} from "lucide-react";

import api from "../../services/api";
import WelcomeHeader from "./WelcomeHeader";

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInput = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchResumes(showLoader = true) {
    try {
      if (showLoader) setLoadingStats(true);

      const res = await api.get("/resume");
      setResumes(res.data?.resumes || []);
    } catch (err) {
      console.error("Failed to fetch resumes:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to load resume data."
      );
    } finally {
      if (showLoader) setLoadingStats(false);
    }
  }

  useEffect(() => {
    fetchResumes();
  }, []);

  async function handleUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!targetRole.trim()) {
      toast.error(
        "Please enter the job role you are targeting."
      );
      e.target.value = "";
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("resume", file);
      formData.append("targetRole", targetRole.trim());

      await api.post("/resume/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        `Resume analyzed for ${targetRole.trim()} 🎉`
      );

      setTargetRole("");
      await fetchResumes(false);
    } catch (err) {
      console.error("Upload error:", err);

      toast.error(
        err.response?.data?.message ||
          "Resume analysis failed."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(resumeId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume and its analysis?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(resumeId);

      await api.delete(`/resume/${resumeId}`);

      toast.success("Resume deleted successfully.");
      await fetchResumes(false);
    } catch (err) {
      console.error("Delete error:", err);

      toast.error(
        err.response?.data?.message ||
          "Failed to delete resume."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function openResume(resume) {
    if (!resume.fileUrl) {
      toast.error("Resume file is not available.");
      return;
    }

    const pdfUrl = `http://localhost:5000${resume.fileUrl}`;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  function downloadResume(resume) {
    if (!resume.fileUrl) {
      toast.error("Resume file is not available.");
      return;
    }

    const pdfUrl = `http://localhost:5000${resume.fileUrl}`;
    const link = document.createElement("a");

    link.href = pdfUrl;
    link.download = resume.originalName || "resume.pdf";
    link.target = "_blank";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getLatestAnalysis(resume) {
    if (!resume?.analyses?.length) return null;

    return [...resume.analyses].sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    )[0];
  }

  const analyses = resumes.flatMap(
    (resume) => resume.analyses || []
  );

  const scores = analyses
    .map((analysis) => analysis.overallScore)
    .filter(
      (score) =>
        typeof score === "number" &&
        !Number.isNaN(score)
    );

  const averageATS =
    scores.length > 0
      ? Math.round(
          scores.reduce(
            (total, score) => total + score,
            0
          ) / scores.length
        )
      : null;

  const analyzedCount = resumes.filter(
    (resume) => getLatestAnalysis(resume)
  ).length;

  const filteredResumes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return resumes;

    return resumes.filter((resume) => {
      const analysis = getLatestAnalysis(resume);

      return (
        resume.originalName
          ?.toLowerCase()
          .includes(query) ||
        resume.targetRole
          ?.toLowerCase()
          .includes(query) ||
        analysis?.targetRole
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [resumes, searchQuery]);

  function getScoreTone(score) {
    const value = Number(score) || 0;

    if (value >= 80) {
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-400",
        track: "bg-emerald-400/10",
      };
    }

    if (value >= 60) {
      return {
        text: "text-cyan-400",
        bg: "bg-cyan-400",
        track: "bg-cyan-400/10",
      };
    }

    if (value >= 40) {
      return {
        text: "text-amber-400",
        bg: "bg-amber-400",
        track: "bg-amber-400/10",
      };
    }

    return {
      text: "text-red-400",
      bg: "bg-red-400",
      track: "bg-red-400/10",
    };
  }

  function clearSearch() {
    setSearchQuery("");
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">
      <Toaster position="top-right" />

      {/* Ambient background */}
      <div className="fixed -top-52 -left-52 w-[620px] h-[620px] rounded-full bg-violet-700/15 blur-[180px] pointer-events-none" />
      <div className="fixed -bottom-56 -right-48 w-[620px] h-[620px] rounded-full bg-cyan-500/10 blur-[190px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/[0.025] blur-[180px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-20 h-20 border-b border-white/10 bg-[#030712]/70 backdrop-blur-2xl">
        <div className="max-w-[1500px] mx-auto h-full px-5 sm:px-8 lg:px-10 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2"
            aria-label="HireSense dashboard"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-400/15 flex items-center justify-center group-hover:bg-violet-500/20 transition">
              <Sparkles
                size={18}
                className="text-violet-400"
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Hire<span className="text-violet-500">Sense</span>
            </h1>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-zinc-400">
            <CheckCircle2
              size={14}
              className="text-emerald-400"
            />
            AI Resume Intelligence
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-10 py-7 md:py-10">
        {/* Welcome */}
        <WelcomeHeader />

        {/* Top statistics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mt-8">
          <StatCard
            icon={<FileText size={22} />}
            label="Resumes Uploaded"
            value={loadingStats ? "..." : resumes.length}
            detail={
              loadingStats
                ? "Loading your resume history"
                : `${analyzedCount} successfully analyzed`
            }
            iconClass="text-cyan-400"
            iconBg="bg-cyan-400/10 border-cyan-400/15"
          />

          <StatCard
            icon={<BarChart3 size={22} />}
            label="Average ATS Score"
            value={
              loadingStats
                ? "..."
                : averageATS !== null
                ? `${averageATS}%`
                : "--"
            }
            detail={
              averageATS !== null
                ? "Across analyzed resumes"
                : "Analyze a resume to see your average"
            }
            iconClass="text-emerald-400"
            iconBg="bg-emerald-400/10 border-emerald-400/15"
          />

          <StatCard
            icon={<Briefcase size={22} />}
            label="Targeted Roles"
            value={
              loadingStats
                ? "..."
                : new Set(
                    resumes
                      .map(
                        (resume) =>
                          resume.targetRole?.trim()
                      )
                      .filter(Boolean)
                  ).size
            }
            detail="Distinct job roles analyzed"
            iconClass="text-violet-400"
            iconBg="bg-violet-400/10 border-violet-400/15"
          />

          <StatCard
            icon={<Users size={22} />}
            label="Compare Candidates"
            value="2–4"
            detail="Candidates can be compared"
            iconClass="text-fuchsia-400"
            iconBg="bg-fuchsia-400/10 border-fuchsia-400/15"
          />
        </section>

        {/* Main action area */}
        <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-5 mt-6">
          {/* Upload */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-violet-500/[0.13] via-white/[0.045] to-white/[0.02] border border-violet-400/20 rounded-3xl p-6 md:p-8 shadow-2xl shadow-violet-950/20">
            <div className="absolute -right-24 -top-24 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl group-hover:bg-violet-500/20 transition duration-500" />

            <div className="relative">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center">
                    <Upload
                      className="text-violet-400"
                      size={28}
                    />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-violet-300 font-semibold">
                      Resume Analyzer
                    </p>
                    <h2 className="text-2xl md:text-3xl font-black mt-1">
                      Analyze a Resume
                    </h2>
                    <p className="text-zinc-400 mt-2 leading-6 max-w-xl">
                      Upload a PDF and get an ATS score,
                      target-role match, missing keywords,
                      strengths, weaknesses, and AI-powered
                      recommendations.
                    </p>
                  </div>
                </div>

                <span className="self-start shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/15 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 size={13} />
                  Ready
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mt-7">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 mb-2">
                    <Briefcase
                      size={15}
                      className="text-violet-400"
                    />
                    Target Job Role
                  </label>

                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) =>
                      setTargetRole(e.target.value)
                    }
                    disabled={uploading}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        targetRole.trim()
                      ) {
                        fileInput.current?.click();
                      }
                    }}
                    placeholder="Enter your target job role"
                    className="w-full h-14 bg-black/25 border border-white/10 focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/10 outline-none rounded-2xl px-4 text-white placeholder:text-zinc-600 transition"
                  />
                </div>

                <div className="flex items-end">
                  <input
                    type="file"
                    hidden
                    accept=".pdf,application/pdf"
                    ref={fileInput}
                    onChange={handleUpload}
                  />

                  <button
                    onClick={() => {
                      if (!targetRole.trim()) {
                        toast.error(
                          "Please enter the job role you are targeting."
                        );
                        return;
                      }

                      fileInput.current?.click();
                    }}
                    disabled={uploading}
                    className="w-full md:w-auto h-14 px-6 bg-violet-600 hover:bg-violet-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold shadow-lg shadow-violet-900/30 transition-all inline-flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Upload & Analyze
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-xs text-zinc-500">
                <span>PDF only</span>
                <span>•</span>
                <span>AI-powered ATS analysis</span>
                <span>•</span>
                <span>Role-specific matching</span>
              </div>
            </div>
          </div>

          {/* Comparison CTA */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-fuchsia-500/[0.11] via-white/[0.045] to-white/[0.02] border border-fuchsia-400/15 rounded-3xl p-6 md:p-7 shadow-2xl shadow-fuchsia-950/10">
            <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-fuchsia-500/10 blur-3xl group-hover:bg-fuchsia-500/20 transition duration-500" />

            <div className="relative h-full flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-400/15 flex items-center justify-center">
                  <Users
                    className="text-fuchsia-400"
                    size={28}
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap mt-6">
                  <h2 className="text-2xl font-bold">
                    Compare Candidates
                  </h2>

                  <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-400/15">
                    Optional
                  </span>
                </div>

                <p className="text-zinc-400 mt-3 leading-6">
                  Compare 2–4 analyzed resumes side-by-side
                  and get an AI-assisted hiring recommendation.
                </p>
              </div>

              <button
                onClick={() => navigate("/compare")}
                className="mt-7 w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/20 text-fuchsia-300 hover:bg-fuchsia-500/20 hover:text-fuchsia-200 hover:border-fuchsia-400/40 font-semibold transition-all"
              >
                Open Candidate Comparison
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Recent analyses */}
        <section className="mt-8 bg-gradient-to-br from-white/[0.055] to-white/[0.025] border border-white/10 rounded-3xl p-5 md:p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  <BarChart3
                    size={19}
                    className="text-violet-400"
                  />
                </div>

                <div>
                  <h3 className="text-2xl md:text-3xl font-bold">
                    Recent Resume Analyses
                  </h3>
                  <p className="text-zinc-500 mt-1 text-sm">
                    Review your uploaded resumes and AI
                    analysis results.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchResumes(false)}
              disabled={loadingStats}
              className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.035] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.07] disabled:opacity-50 transition"
              title="Refresh resume history"
            >
              <RefreshCw
                size={15}
                className={
                  loadingStats ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>

          {/* Search */}
          {resumes.length > 0 && !loadingStats && (
            <div className="relative mt-6">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search resumes or target roles..."
                className="w-full h-12 bg-black/20 border border-white/10 focus:border-violet-500/50 outline-none rounded-xl pl-11 pr-11 text-white placeholder:text-zinc-600 transition"
              />

              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {loadingStats && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-7">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Empty */}
          {!loadingStats && resumes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-white/[0.025] border border-white/10 flex items-center justify-center">
                <FileText
                  size={38}
                  className="text-zinc-700"
                />
              </div>

              <h2 className="text-2xl font-bold mt-5">
                No Resume Uploaded Yet
              </h2>

              <p className="text-zinc-500 mt-2 max-w-md">
                Upload your first PDF resume above to start
                your ATS analysis.
              </p>

              <button
                onClick={() =>
                  document
                    .querySelector('input[type="text"]')
                    ?.focus()
                }
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition"
              >
                Get Started
                <ArrowRight size={17} />
              </button>
            </div>
          )}

          {/* No search results */}
          {!loadingStats &&
            resumes.length > 0 &&
            filteredResumes.length === 0 && (
              <div className="py-14 text-center">
                <Search
                  size={42}
                  className="mx-auto text-zinc-700"
                />
                <h3 className="text-xl font-bold mt-4">
                  No matching resumes
                </h3>
                <p className="text-zinc-500 mt-2">
                  Try a different resume name or target role.
                </p>

                <button
                  onClick={clearSearch}
                  className="mt-4 text-violet-400 hover:text-violet-300 font-semibold"
                >
                  Clear search
                </button>
              </div>
            )}

          {/* Resume list */}
          {!loadingStats &&
            filteredResumes.length > 0 && (
              <div className="mt-7 grid grid-cols-1 xl:grid-cols-2 gap-5">
                {filteredResumes.map((resume) => {
                  const latestAnalysis =
                    getLatestAnalysis(resume);

                  const isDeleting =
                    deletingId === resume.id;

                  const atsScore =
                    latestAnalysis?.overallScore;

                  const roleMatch =
                    latestAnalysis?.jobMatch;

                  const atsTone =
                    getScoreTone(atsScore);

                  const matchTone =
                    getScoreTone(roleMatch);

                  return (
                    <article
                      key={resume.id}
                      className="group relative overflow-hidden bg-black/20 border border-white/10 rounded-2xl p-5 md:p-6 hover:border-violet-500/35 hover:bg-white/[0.035] transition-all duration-300"
                    >
                      <div className="absolute -right-20 -top-20 w-52 h-52 rounded-full bg-violet-500/5 blur-3xl group-hover:bg-violet-500/10 transition" />

                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 shrink-0 rounded-xl bg-violet-500/10 border border-violet-400/10 flex items-center justify-center">
                            <FileText
                              className="text-violet-400"
                              size={23}
                            />
                          </div>

                          <div className="min-w-0">
                            <h4
                              className="font-bold text-base md:text-lg truncate"
                              title={resume.originalName}
                            >
                              {resume.originalName}
                            </h4>

                            <p className="text-sm text-zinc-500 mt-1">
                              Uploaded{" "}
                              {resume.uploadedAt
                                ? new Date(
                                    resume.uploadedAt
                                  ).toLocaleDateString(
                                    undefined,
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "Recently"}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-400/10">
                          <CheckCircle2 size={12} />
                          {resume.aiStatus === "Analyzing"
                            ? "Analyzing"
                            : "Analyzed"}
                        </span>
                      </div>

                      {/* Score cards */}
                      <div className="relative grid grid-cols-2 gap-3 mt-6">
                        <ScoreCard
                          label="ATS Score"
                          score={atsScore}
                          tone={atsTone}
                        />

                        <ScoreCard
                          label="Role Match"
                          score={roleMatch}
                          tone={matchTone}
                        />
                      </div>

                      {/* Role */}
                      <div className="relative mt-4 rounded-xl bg-white/[0.025] border border-white/5 p-3.5 flex items-center gap-2 min-w-0">
                        <Briefcase
                          size={16}
                          className="text-violet-400 shrink-0"
                        />

                        <span className="text-xs uppercase tracking-wider text-zinc-500 shrink-0">
                          Target
                        </span>

                        <span
                          className="text-sm font-semibold text-zinc-200 truncate"
                          title={
                            resume.targetRole ||
                            latestAnalysis?.targetRole
                          }
                        >
                          {resume.targetRole ||
                            latestAnalysis?.targetRole ||
                            "Selected job role"}
                        </span>
                      </div>

                      {/* ML Predicted Category */}
                      <div className="relative mt-3 rounded-xl bg-violet-500/[0.045] border border-violet-400/10 p-3.5">
                        <div className="flex items-center gap-2">
                          <Sparkles
                            size={16}
                            className="text-violet-400 shrink-0"
                          />

                          <span className="text-xs uppercase tracking-wider text-zinc-500">
                            ML Career Prediction
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-2">
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                              Predicted Category
                            </p>

                            <p
                              className="text-sm font-bold text-violet-300 truncate mt-0.5"
                              title={
                                resume.predictedCategory ||
                                "Prediction unavailable"
                              }
                            >
                              {resume.predictedCategory ||
                                "Prediction unavailable"}
                            </p>
                          </div>

                        </div>
                      </div>

                      {/* Actions */}
                      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-5 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <ActionButton
                            onClick={() =>
                              openResume(resume)
                            }
                            title="Open resume"
                            className="text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <ExternalLink size={17} />
                          </ActionButton>

                          <ActionButton
                            onClick={() =>
                              downloadResume(resume)
                            }
                            title="Download resume"
                            className="text-blue-400 hover:bg-blue-500/10"
                          >
                            <Download size={17} />
                          </ActionButton>

                          <ActionButton
                            onClick={() =>
                              handleDelete(resume.id)
                            }
                            disabled={isDeleting}
                            title="Delete resume"
                            className="text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2
                              size={17}
                              className={
                                isDeleting
                                  ? "animate-pulse"
                                  : ""
                              }
                            />
                          </ActionButton>
                        </div>

                        <button
                          onClick={() =>
                            navigate(
                              `/resume/${resume.id}`
                            )
                          }
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-400/10 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200 font-semibold transition"
                        >
                          View Analysis
                          <ArrowRight size={17} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  iconClass,
  iconBg,
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 hover:border-white/15 hover:bg-white/[0.06] transition-all">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500 font-semibold">
            {label}
          </p>

          <p className="text-3xl md:text-4xl font-black tracking-tight mt-2">
            {value}
          </p>

          <p className="text-xs text-zinc-500 mt-2 leading-5">
            {detail}
          </p>
        </div>

        <div
          className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center ${iconBg}`}
        >
          <span className={iconClass}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, tone }) {
  const value =
    score !== null &&
    score !== undefined &&
    !Number.isNaN(Number(score))
      ? Math.max(
          0,
          Math.min(100, Number(score))
        )
      : null;

  return (
    <div className="rounded-xl bg-white/[0.035] border border-white/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
          {label}
        </p>

        {value !== null && (
          <span className="text-[10px] text-zinc-600">
            /100
          </span>
        )}
      </div>

      <p
        className={`text-2xl font-black mt-1 ${
          value === null
            ? "text-zinc-600"
            : tone.text
        }`}
      >
        {value === null ? "--" : `${Math.round(value)}%`}
      </p>

      {value !== null && (
        <div
          className={`h-1.5 rounded-full mt-3 overflow-hidden ${tone.track}`}
        >
          <div
            className={`h-full rounded-full ${tone.bg} transition-all`}
            style={{ width: `${value}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  disabled,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2.5 rounded-xl transition ${className}`}
    >
      {children}
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/[0.06]" />
        <div className="flex-1">
          <div className="h-4 w-2/3 bg-white/[0.06] rounded" />
          <div className="h-3 w-1/3 bg-white/[0.04] rounded mt-3" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="h-24 rounded-xl bg-white/[0.04]" />
        <div className="h-24 rounded-xl bg-white/[0.04]" />
      </div>

      <div className="h-12 rounded-xl bg-white/[0.04] mt-4" />
      <div className="h-10 rounded-xl bg-white/[0.04] mt-5" />
    </div>
  );
}