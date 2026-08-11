import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Search,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";

import api from "../../services/api";

export default function CompareCandidates() {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  useEffect(() => {
    async function loadResumes() {
      try {
        const response = await api.get("/resume");
        setResumes(response.data?.resumes || []);
      } catch (error) {
        console.error("Failed to load resumes:", error);
        toast.error(
          error.response?.data?.message ||
            "Failed to load resumes."
        );
      } finally {
        setLoading(false);
      }
    }

    loadResumes();
  }, []);

  function getLatestAnalysis(resume) {
    if (!resume?.analyses?.length) return null;

    return [...resume.analyses].sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    )[0];
  }

  const analyzedResumes = useMemo(
    () =>
      resumes.filter((resume) =>
        Boolean(getLatestAnalysis(resume))
      ),
    [resumes]
  );

  const filteredResumes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return analyzedResumes;

    return analyzedResumes.filter((resume) => {
      const analysis = getLatestAnalysis(resume);

      return (
        resume.originalName?.toLowerCase().includes(query) ||
        resume.targetRole?.toLowerCase().includes(query) ||
        analysis?.targetRole?.toLowerCase().includes(query)
      );
    });
  }, [analyzedResumes, search]);

  const selectedCandidates = useMemo(
    () =>
      selectedIds
        .map((id) =>
          analyzedResumes.find((resume) => resume.id === id)
        )
        .filter(Boolean),
    [selectedIds, analyzedResumes]
  );

  const targetRole = useMemo(() => {
    const resume = selectedCandidates[0];
    const analysis = getLatestAnalysis(resume);

    return (
      resume?.targetRole ||
      analysis?.targetRole ||
      ""
    );
  }, [selectedCandidates]);

  const localRanking = useMemo(() => {
    return selectedCandidates
      .map((resume) => {
        const analysis = getLatestAnalysis(resume);
        const ats = Number(analysis?.overallScore) || 0;
        const jobMatch = Number(analysis?.jobMatch) || 0;

        return {
          id: resume.id,
          name: resume.originalName || resume.title,
          originalName: resume.originalName,
          targetRole:
            resume.targetRole || analysis?.targetRole || "",
          overallScore: ats,
          jobMatch,
          rankingScore: Math.round(
            ats * 0.5 + jobMatch * 0.5
          ),
          strengths: analysis?.strengths || "",
          weaknesses: analysis?.weaknesses || "",
          missingKeywords:
            analysis?.missingKeywords || "",
          keywordMatch: analysis?.keywordMatch,
          technicalSkills: analysis?.technicalSkills,
          experienceRelevance:
            analysis?.experienceRelevance,
          projectRelevance:
            analysis?.projectRelevance,
          resumeStructure:
            analysis?.resumeStructure,
        };
      })
      .sort((a, b) => b.rankingScore - a.rankingScore)
      .map((candidate, index) => ({
        ...candidate,
        rank: index + 1,
      }));
  }, [selectedCandidates]);

  function toggleCandidate(id) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter(
          (candidateId) => candidateId !== id
        );
      }

      if (current.length >= 4) {
        toast.error("You can compare up to 4 candidates.");
        return current;
      }

      return [...current, id];
    });

    setComparisonResult(null);
  }

  function removeCandidate(id) {
    setSelectedIds((current) =>
      current.filter((candidateId) => candidateId !== id)
    );
    setComparisonResult(null);
  }

  function clearSelection() {
    setSelectedIds([]);
    setComparisonResult(null);
  }

  async function compareCandidates() {
    if (selectedIds.length < 2) {
      toast.error("Please select at least 2 candidates.");
      return;
    }

    try {
      setComparisonLoading(true);
      setComparisonResult(null);

      const response = await api.post("/resume/compare", {
        resumeIds: selectedIds,
        targetRole: targetRole || undefined,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Candidate comparison failed."
        );
      }

      setComparisonResult(response.data);

      if (
        response.data.aiRecommendation?.available === false
      ) {
        toast.error(
          "Comparison completed, but AI recommendation is temporarily unavailable."
        );
      } else {
        toast.success("AI comparison completed.");
      }
    } catch (error) {
      console.error("Candidate comparison error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to compare candidates."
      );
    } finally {
      setComparisonLoading(false);
    }
  }

  const candidates =
    comparisonResult?.candidates?.length
      ? comparisonResult.candidates
      : localRanking;

  const aiRecommendation =
    comparisonResult?.aiRecommendation;

  const recommendedCandidate =
    aiRecommendation?.available !== false &&
    aiRecommendation?.recommendedCandidateId
      ? candidates.find(
          (candidate) =>
            candidate.id ===
            aiRecommendation.recommendedCandidateId
        )
      : null;

  function scoreClass(score) {
    const value = Number(score) || 0;

    if (value >= 80) return "text-emerald-400";
    if (value >= 60) return "text-cyan-400";
    if (value >= 40) return "text-amber-400";
    return "text-red-400";
  }

  function scoreBarClass(score) {
    const value = Number(score) || 0;

    if (value >= 80) return "bg-emerald-400";
    if (value >= 60) return "bg-cyan-400";
    if (value >= 40) return "bg-amber-400";
    return "bg-red-400";
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Toaster position="top-right" />

      <div className="fixed -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[170px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[450px] h-[450px] rounded-full bg-fuchsia-500/15 blur-[170px] pointer-events-none" />

      <nav className="relative z-10 h-20 border-b border-white/10 backdrop-blur-xl flex items-center justify-between px-6 md:px-10">
        <button
          onClick={() => navigate("/")}
          className="text-2xl md:text-3xl font-black"
        >
          Hire<span className="text-violet-500">Sense</span>
        </button>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-zinc-300 hover:text-white hover:bg-white/[0.07] transition"
        >
          <ArrowLeft size={17} />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-fuchsia-400/15 bg-fuchsia-500/10 text-fuchsia-300 text-xs font-semibold uppercase tracking-wider">
              <Users size={14} />
              Optional Feature
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-5">
              Compare Candidates
            </h1>

            <p className="text-zinc-400 mt-3 max-w-2xl leading-7">
              Select up to four analyzed resumes and compare
              their ATS performance, role fit, and AI hiring
              recommendation.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Selected
            </p>
            <p className="text-2xl font-black mt-1">
              {selectedCandidates.length}
              <span className="text-zinc-600 text-base font-medium">
                {" "}
                / 4
              </span>
            </p>
          </div>
        </div>

        <section className="mt-8 bg-gradient-to-br from-white/[0.055] to-white/[0.025] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                Choose Candidates
              </h2>
              <p className="text-zinc-500 mt-1">
                Only resumes with completed AI analysis can be
                compared.
              </p>
            </div>

            {selectedCandidates.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="relative mt-6">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by resume name or target role..."
              className="w-full h-12 bg-black/20 border border-white/10 focus:border-violet-500/60 outline-none rounded-xl pl-11 pr-4 text-white placeholder:text-zinc-600 transition"
            />
          </div>

          {loading ? (
            <div className="py-14 text-center text-zinc-500">
              Loading analyzed resumes...
            </div>
          ) : filteredResumes.length === 0 ? (
            <div className="py-14 text-center">
              <FileText
                size={55}
                className="mx-auto text-zinc-700"
              />
              <h3 className="text-xl font-bold mt-4">
                No analyzed resumes found
              </h3>
              <p className="text-zinc-500 mt-2">
                Upload and analyze resumes from the dashboard
                first.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition"
              >
                Analyze a Resume
                <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
              {filteredResumes.map((resume) => {
                const analysis =
                  getLatestAnalysis(resume);
                const selected =
                  selectedIds.includes(resume.id);
                const ats =
                  Number(analysis?.overallScore) || 0;
                const roleMatch =
                  Number(analysis?.jobMatch) || 0;

                return (
                  <button
                    key={resume.id}
                    type="button"
                    onClick={() =>
                      toggleCandidate(resume.id)
                    }
                    className={`relative text-left rounded-2xl p-5 border transition-all duration-200 ${
                      selected
                        ? "border-fuchsia-400/50 bg-fuchsia-500/[0.10] shadow-lg shadow-fuchsia-950/20"
                        : "border-white/10 bg-black/20 hover:border-violet-400/30 hover:bg-white/[0.04]"
                    }`}
                  >
                    {selected && (
                      <div className="absolute right-4 top-4 w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center">
                        <CheckCircle2
                          size={15}
                          className="text-white"
                        />
                      </div>
                    )}

                    <div className="flex items-start gap-3 pr-8">
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-violet-500/10 border border-violet-400/10 flex items-center justify-center">
                        <FileText
                          size={21}
                          className="text-violet-400"
                        />
                      </div>

                      <div className="min-w-0">
                        <h3
                          className="font-bold truncate"
                          title={resume.originalName}
                        >
                          {resume.originalName}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1 truncate">
                          {resume.targetRole ||
                            analysis?.targetRole ||
                            "Target role not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <MiniScore label="ATS" score={ats} scoreClass={scoreClass} />
                      <MiniScore
                        label="Role Match"
                        score={roleMatch}
                        scoreClass={scoreClass}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedCandidates.length >= 2 && (
            <div className="mt-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-white/10">
              <div>
                <p className="font-semibold">
                  Ready to compare{" "}
                  {selectedCandidates.length} candidates
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  The backend will calculate the ranking and
                  ask Gemini for an optional hiring recommendation.
                </p>
              </div>

              <button
                onClick={compareCandidates}
                disabled={comparisonLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-60 disabled:cursor-not-allowed font-bold transition"
              >
                {comparisonLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Compare with AI
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {selectedCandidates.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {selectedCandidates.map((resume) => (
              <div
                key={resume.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/15 text-fuchsia-200 text-sm"
              >
                <FileText size={14} />
                <span className="max-w-[220px] truncate">
                  {resume.originalName}
                </span>
                <button
                  onClick={() =>
                    removeCandidate(resume.id)
                  }
                  className="text-fuchsia-300/70 hover:text-white transition"
                  title="Remove candidate"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {comparisonResult &&
          aiRecommendation &&
          aiRecommendation.available !== false && (
            <section className="mt-8">
              <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.12] via-fuchsia-500/[0.07] to-white/[0.025] p-6 md:p-8 shadow-2xl shadow-violet-950/20">
                <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />

                <div className="relative">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                        <Trophy
                          size={29}
                          className="text-amber-400"
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs uppercase tracking-wider text-violet-300 font-bold">
                            AI Hiring Recommendation
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/15 text-emerald-300 text-[10px] uppercase tracking-wider font-bold">
                            <Sparkles size={11} />
                            Gemini
                          </span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black mt-2">
                          {aiRecommendation.recommendedCandidateName}
                        </h2>

                        <p className="text-zinc-400 mt-2 max-w-2xl leading-6">
                          {aiRecommendation.summary}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-2xl bg-black/20 border border-white/10 px-5 py-4">
                      <p className="text-xs uppercase tracking-wider text-zinc-500">
                        AI Confidence
                      </p>
                      <p className="text-3xl font-black text-violet-300 mt-1">
                        {Math.round(
                          aiRecommendation.confidence
                        )}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-7">
                    <RecommendationCard
                      title="Why this candidate"
                      icon={
                        <CheckCircle2
                          size={18}
                          className="text-emerald-400"
                        />
                      }
                      content={aiRecommendation.reasons}
                    />

                    <RecommendationCard
                      title="Key strengths"
                      icon={
                        <Trophy
                          size={18}
                          className="text-amber-400"
                        />
                      }
                      content={
                        aiRecommendation.keyStrengths
                      }
                    />

                    <RecommendationCard
                      title="Potential concerns"
                      icon={
                        <ShieldAlert
                          size={18}
                          className="text-orange-400"
                        />
                      }
                      content={
                        aiRecommendation.potentialConcerns
                      }
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-violet-400/15 bg-violet-500/[0.07] p-5">
                    <p className="text-xs uppercase tracking-wider text-violet-300 font-bold">
                      Hiring Recommendation
                    </p>
                    <p className="text-zinc-200 font-semibold mt-2 leading-6">
                      {aiRecommendation.hiringRecommendation}
                    </p>
                  </div>

                  {recommendedCandidate && (
                    <button
                      onClick={() =>
                        navigate(
                          `/resume/${recommendedCandidate.id}`
                        )
                      }
                      className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.10] font-semibold transition"
                    >
                      View Recommended Candidate
                      <ArrowRight size={17} />
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

        {comparisonResult &&
          aiRecommendation?.available === false && (
            <div className="mt-8 rounded-3xl border border-amber-400/15 bg-amber-500/[0.05] p-5 md:p-6">
              <div className="flex items-start gap-3">
                <ShieldAlert
                  size={21}
                  className="text-amber-400 shrink-0 mt-0.5"
                />
                <div>
                  <h3 className="font-bold text-amber-200">
                    AI recommendation unavailable
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {aiRecommendation.message ||
                      "The normal candidate ranking is still available below."}
                  </p>
                </div>
              </div>
            </div>
          )}

        {selectedCandidates.length >= 2 && (
          <section className="mt-8">
            {candidates.length > 0 && (
              <div className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.10] via-white/[0.035] to-white/[0.02] p-6 md:p-8">
                <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-amber-400/10 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                      <Trophy
                        size={28}
                        className="text-amber-400"
                      />
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                        {recommendedCandidate
                          ? "AI recommended candidate"
                          : "Current top candidate"}
                      </p>

                      <h2 className="text-2xl md:text-3xl font-black mt-1">
                        {recommendedCandidate?.originalName ||
                          candidates[0].name}
                      </h2>

                      <p className="text-zinc-400 mt-1">
                        {recommendedCandidate
                          ? "Recommended using the selected candidate evidence and AI hiring analysis."
                          : "Strongest combined ATS and target-role performance."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-zinc-500">
                        Ranking Score
                      </p>
                      <p className="text-3xl font-black text-amber-400">
                        {Math.round(
                          Number(
                            (
                              recommendedCandidate ||
                              candidates[0]
                            )?.rankingScore
                          ) || 0
                        )}
                        %
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        navigate(
                          `/resume/${
                            (
                              recommendedCandidate ||
                              candidates[0]
                            ).id
                          }`
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.10] transition font-semibold"
                    >
                      View
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 bg-gradient-to-br from-white/[0.055] to-white/[0.025] border border-white/10 rounded-3xl p-5 md:p-8 shadow-2xl shadow-black/20">
              <div className="flex items-center gap-3">
                <BarChart3
                  className="text-violet-400"
                  size={24}
                />
                <div>
                  <h2 className="text-2xl font-bold">
                    Candidate Comparison
                  </h2>
                  <p className="text-zinc-500 text-sm mt-1">
                    Ranking uses 50% ATS score and 50% target-role match.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto mt-7">
                <div
                  className="grid gap-4 min-w-[760px]"
                  style={{
                    gridTemplateColumns:
                      `190px repeat(${candidates.length}, minmax(180px, 1fr))`,
                  }}
                >
                  <div className="p-4 text-xs uppercase tracking-wider text-zinc-500">
                    Metric
                  </div>

                  {candidates.map((candidate, index) => (
                    <div
                      key={candidate.id}
                      className={`rounded-2xl p-4 border ${
                        index === 0
                          ? "border-amber-400/20 bg-amber-400/[0.05]"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Trophy
                            size={16}
                            className="text-amber-400"
                          />
                        )}
                        <span className="text-xs font-semibold text-zinc-500">
                          #{candidate.rank || index + 1}
                        </span>
                      </div>

                      <h3
                        className="font-bold mt-2 truncate"
                        title={
                          candidate.originalName ||
                          candidate.name
                        }
                      >
                        {candidate.originalName ||
                          candidate.name}
                      </h3>

                      <p className="text-xs text-zinc-500 mt-1 truncate">
                        {candidate.targetRole ||
                          "Role not specified"}
                      </p>
                    </div>
                  ))}

                  <MetricLabel label="ATS Score" />
                  {candidates.map((candidate) => (
                    <ScoreCell
                      key={`ats-${candidate.id}`}
                      score={candidate.overallScore}
                      scoreClass={scoreClass}
                      scoreBarClass={scoreBarClass}
                    />
                  ))}

                  <MetricLabel label="Role Match" />
                  {candidates.map((candidate) => (
                    <ScoreCell
                      key={`role-${candidate.id}`}
                      score={candidate.jobMatch}
                      scoreClass={scoreClass}
                      scoreBarClass={scoreBarClass}
                    />
                  ))}

                  <MetricLabel label="Ranking Score" />
                  {candidates.map((candidate) => (
                    <ScoreCell
                      key={`ranking-${candidate.id}`}
                      score={candidate.rankingScore}
                      scoreClass={scoreClass}
                      scoreBarClass={scoreBarClass}
                    />
                  ))}

                  <MetricLabel label="Keyword Match" />
                  {candidates.map((candidate) => (
                    <ScoreCell
                      key={`keyword-${candidate.id}`}
                      score={candidate.keywordMatch}
                      scoreClass={scoreClass}
                      scoreBarClass={scoreBarClass}
                    />
                  ))}

                  <MetricLabel label="Technical Skills" />
                  {candidates.map((candidate) => (
                    <ScoreCell
                      key={`technical-${candidate.id}`}
                      score={candidate.technicalSkills}
                      scoreClass={scoreClass}
                      scoreBarClass={scoreBarClass}
                    />
                  ))}

                  <MetricLabel label="Experience Relevance" />
                  {candidates.map((candidate) => (
                    <ScoreCell
                      key={`experience-${candidate.id}`}
                      score={candidate.experienceRelevance}
                      scoreClass={scoreClass}
                      scoreBarClass={scoreBarClass}
                    />
                  ))}

                  <MetricLabel label="Project Relevance" />
                  {candidates.map((candidate) => (
                    <ScoreCell
                      key={`project-${candidate.id}`}
                      score={candidate.projectRelevance}
                      scoreClass={scoreClass}
                      scoreBarClass={scoreBarClass}
                    />
                  ))}

                  <MetricLabel label="Resume Structure" />
                  {candidates.map((candidate) => (
                    <ScoreCell
                      key={`structure-${candidate.id}`}
                      score={candidate.resumeStructure}
                      scoreClass={scoreClass}
                      scoreBarClass={scoreBarClass}
                    />
                  ))}

                  <MetricLabel label="Target Role" />
                  {candidates.map((candidate) => (
                    <TextCell
                      key={`target-${candidate.id}`}
                      content={candidate.targetRole}
                    />
                  ))}

                  <MetricLabel label="Strengths" />
                  {candidates.map((candidate) => (
                    <TextCell
                      key={`strengths-${candidate.id}`}
                      content={candidate.strengths}
                    />
                  ))}

                  <MetricLabel label="Weaknesses" />
                  {candidates.map((candidate) => (
                    <TextCell
                      key={`weaknesses-${candidate.id}`}
                      content={candidate.weaknesses}
                    />
                  ))}

                  <MetricLabel label="Missing Keywords" />
                  {candidates.map((candidate) => (
                    <TextCell
                      key={`missing-${candidate.id}`}
                      content={candidate.missingKeywords}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {selectedCandidates.length < 2 &&
          !loading &&
          analyzedResumes.length > 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-16 px-6 text-center">
              <Users
                size={55}
                className="mx-auto text-zinc-700"
              />
              <h2 className="text-2xl font-bold mt-5">
                Select at least 2 candidates
              </h2>
              <p className="text-zinc-500 mt-2 max-w-lg mx-auto">
                Choose two to four analyzed resumes above to
                start the comparison.
              </p>
            </div>
          )}
      </main>
    </div>
  );
}

function MetricLabel({ label }) {
  return (
    <div className="flex items-center p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <span className="text-sm font-semibold text-zinc-300">
        {label}
      </span>
    </div>
  );
}

function ScoreCell({
  score,
  scoreClass,
  scoreBarClass,
}) {
  const safeScore = Math.max(
    0,
    Math.min(100, Number(score) || 0)
  );

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
      <span
        className={`text-2xl font-black ${scoreClass(
          safeScore
        )}`}
      >
        {Math.round(safeScore)}%
      </span>

      <div className="h-1.5 rounded-full bg-white/5 mt-3 overflow-hidden">
        <div
          className={`h-full rounded-full ${scoreBarClass(
            safeScore
          )}`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  );
}

function MiniScore({
  label,
  score,
  scoreClass,
}) {
  return (
    <div className="rounded-xl bg-white/[0.035] border border-white/5 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={`text-xl font-black mt-1 ${scoreClass(
          score
        )}`}
      >
        {Math.round(Number(score) || 0)}%
      </p>
    </div>
  );
}

function TextCell({ content }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4">
      <p className="text-sm leading-6 text-zinc-400">
        {String(
          content || "No information available."
        ).trim()}
      </p>
    </div>
  );
}

function RecommendationCard({
  title,
  icon,
  content,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-bold">{title}</h3>
      </div>
      <p className="text-sm text-zinc-400 leading-6 mt-3">
        {content || "No information available."}
      </p>
    </div>
  );
}