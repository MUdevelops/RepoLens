"use strict";

/* =====================================================================
   RepoLens
   A GitHub repository analyzer that renders ONLY data returned by the
   real GitHub REST API. There is no demo/mock/sample/fallback dataset
   anywhere in this file. Every failure path shows an explicit error.
   ===================================================================== */

const GITHUB_API = "https://api.github.com";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = "repolens_cache_v1_";

/* ------------------------- DOM references ------------------------- */

const form = document.getElementById("analyze-form");
const input = document.getElementById("repo-url");
const analyzeBtn = document.getElementById("analyze-btn");

const loadingState = document.getElementById("loading-state");
const loadingText = document.getElementById("loading-text");
const errorState = document.getElementById("error-state");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");
const results = document.getElementById("results");

/* ------------------------- splash screen ------------------------- */
/* One orchestrated load moment, then it gets out of the way for good. */
(function initSplash() {
  const splash = document.getElementById("splash-screen");
  if (!splash) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const minVisibleMs = reducedMotion ? 120 : 850;
  const start = Date.now();

  function dismiss() {
    const elapsed = Date.now() - start;
    const wait = Math.max(0, minVisibleMs - elapsed);
    setTimeout(() => {
      splash.classList.add("splash-hide");
      splash.setAttribute("aria-hidden", "true");
      setTimeout(() => {
        splash.remove();
        input.focus();
      }, reducedMotion ? 20 : 400);
    }, wait);
  }

  if (document.readyState === "complete") {
    dismiss();
  } else {
    window.addEventListener("load", dismiss, { once: true });
  }
  // Safety net in case the load event never fires for some reason.
  setTimeout(dismiss, 4000);
})();

/* ============================== Step 1 ==============================
   URL parsing / validation — no string-matching guesswork, real
   hostname + path-segment validation.
   ===================================================================== */

/**
 * Parses user input into { owner, repo } or throws a descriptive Error.
 * Accepts:
 *   owner/repo
 *   github.com/owner/repo
 *   https://github.com/owner/repo(.git)(/)
 *   https://www.github.com/owner/repo(.git)(/)
 */
function parseGitHubUrl(raw) {
  const value = (raw || "").trim();
  if (!value) {
    throw new Error("Enter a GitHub repository URL or owner/repository.");
  }

  // Shorthand: "owner/repo" with no protocol and no dots-as-host
  const shorthandMatch = value.match(/^([^\s/]+)\/([^\s/]+)$/);
  const looksLikeBareHost = /^(www\.)?github\.com/i.test(value);

  let pathSegments;

  if (shorthandMatch && !looksLikeBareHost && !value.includes("://")) {
    pathSegments = [shorthandMatch[1], shorthandMatch[2]];
  } else {
    let candidate = value;
    if (!/^https?:\/\//i.test(candidate)) {
      candidate = "https://" + candidate;
    }

    let url;
    try {
      url = new URL(candidate);
    } catch {
      throw new Error("That doesn't look like a valid URL.");
    }

    const host = url.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") {
      throw new Error("Only github.com repository URLs are supported.");
    }

    const trimmedPath = url.pathname.replace(/^\/+|\/+$/g, "");
    if (!trimmedPath) {
      throw new Error(
        "That URL doesn't point to a repository. Include the owner and repository name, e.g. github.com/owner/repository."
      );
    }
    pathSegments = trimmedPath.split("/").filter(Boolean);
  }

  if (pathSegments.length < 2) {
    throw new Error(
      "Incomplete URL — a username alone isn't a repository. Provide owner/repository."
    );
  }
  if (pathSegments.length > 2) {
    throw new Error(
      "That URL points inside a repository (e.g. a file, branch, or issue). Provide just the repository root, e.g. github.com/owner/repository."
    );
  }

  const owner = pathSegments[0];
  let repo = pathSegments[1].replace(/\.git$/i, "");

  const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
  const repoPattern = /^[A-Za-z0-9._-]{1,100}$/;

  if (!ownerPattern.test(owner)) {
    throw new Error(`"${owner}" isn't a valid GitHub username.`);
  }
  if (!repoPattern.test(repo)) {
    throw new Error(`"${repo}" isn't a valid repository name.`);
  }

  return { owner, repo };
}

/* ============================== Step 2 ==============================
   GitHub API access layer. Every function returns real data or throws
   a typed error — nothing here ever substitutes fabricated data.
   ===================================================================== */

class GitHubApiError extends Error {
  constructor(type, message, extra = {}) {
    super(message);
    this.type = type; // 'not_found' | 'rate_limit' | 'network' | 'api_error' | 'invalid_json'
    Object.assign(this, extra);
  }
}

async function ghFetch(path) {
  let response;
  try {
    response = await fetch(GITHUB_API + path, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  } catch (networkErr) {
    throw new GitHubApiError(
      "network",
      "Couldn't reach the GitHub API. Check your internet connection and try again."
    );
  }

  const remaining = response.headers.get("x-ratelimit-remaining");
  const resetHeader = response.headers.get("x-ratelimit-reset");

  if (response.status === 403 || response.status === 429) {
    if (remaining === "0") {
      const resetDate = resetHeader
        ? new Date(parseInt(resetHeader, 10) * 1000)
        : null;
      throw new GitHubApiError(
        "rate_limit",
        resetDate
          ? `GitHub API rate limit reached. It resets at ${resetDate.toLocaleTimeString()}. Please try again after that.`
          : "GitHub API rate limit reached. Please try again later.",
      );
    }
    throw new GitHubApiError(
      "api_error",
      "GitHub API refused the request (403). This can happen with abuse-detection limits — please try again shortly."
    );
  }

  if (response.status === 404) {
    throw new GitHubApiError("not_found", "Not found.");
  }

  if (!response.ok) {
    throw new GitHubApiError(
      "api_error",
      `GitHub API returned an unexpected error (status ${response.status}).`
    );
  }

  try {
    return await response.json();
  } catch {
    throw new GitHubApiError(
      "invalid_json",
      "GitHub returned a response that couldn't be parsed as JSON."
    );
  }
}

/** Same as ghFetch, but resolves to { data, failed } instead of throwing —
 *  used for secondary, non-critical calls where one failure shouldn't
 *  take down the whole dashboard. */
async function ghFetchSoft(path) {
  try {
    const data = await ghFetch(path);
    return { data, failed: false };
  } catch (err) {
    return { data: null, failed: true, error: err };
  }
}

function fetchRepository(owner, repo) {
  return ghFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
}
function fetchLanguages(owner, repo) {
  return ghFetchSoft(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`);
}
function fetchContributors(owner, repo) {
  return ghFetchSoft(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=100&anon=1`);
}
function fetchCommits(owner, repo) {
  return ghFetchSoft(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=5`);
}
function fetchRootContents(owner, repo) {
  return ghFetchSoft(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/`);
}
function fetchOpenPulls(owner, repo) {
  return ghFetchSoft(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=100`);
}
function fetchLatestRelease(owner, repo) {
  return ghFetchSoft(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`);
}

/* ============================== Step 3 ==============================
   Lightweight client-side cache, explicitly labeled when used.
   ===================================================================== */

function cacheKey(owner, repo) {
  return CACHE_PREFIX + owner.toLowerCase() + "/" + repo.toLowerCase();
}

function readCache(owner, repo) {
  try {
    const raw = localStorage.getItem(cacheKey(owner, repo));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== "number") return null;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(owner, repo, bundle) {
  try {
    localStorage.setItem(
      cacheKey(owner, repo),
      JSON.stringify({ timestamp: Date.now(), bundle })
    );
  } catch {
    /* localStorage unavailable or full — caching is best-effort only */
  }
}

/* ============================== Step 4 ==============================
   Validation of the raw repository object before anything is rendered.
   ===================================================================== */

function validateRepoShape(repoData) {
  if (!repoData || typeof repoData !== "object") {
    throw new GitHubApiError("invalid_json", "GitHub API did not return a repository object.");
  }
  if (typeof repoData.name !== "string" || !repoData.name) {
    throw new GitHubApiError("invalid_json", "The API response is missing a repository name.");
  }
  if (!repoData.owner || typeof repoData.owner.login !== "string") {
    throw new GitHubApiError("invalid_json", "The API response is missing owner information.");
  }
  return true;
}

/* ============================== Step 5 ==============================
   Deterministic analysis — every value below is either copied straight
   from the API response or computed from it. Nothing is invented.
   ===================================================================== */

function daysBetween(a, b) {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

function formatDuration(days) {
  if (days < 1) return "less than a day";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"}`;
  }
  const years = Math.floor(days / 365);
  const remMonths = Math.floor((days % 365) / 30);
  return `${years} year${years === 1 ? "" : "s"}${remMonths ? ` ${remMonths} mo` : ""}`;
}

function relativeTime(dateStr) {
  const then = new Date(dateStr);
  const days = daysBetween(then, new Date());
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function analyzeRepository(repo, contents, openPulls, releaseResult) {
  const now = new Date();
  const createdAt = new Date(repo.created_at);
  const pushedAt = new Date(repo.pushed_at);
  const updatedAt = new Date(repo.updated_at);

  const ageDays = daysBetween(createdAt, now);
  const daysSincePush = daysBetween(pushedAt, now);

  let activityLevel;
  if (repo.archived) activityLevel = "Archived";
  else if (daysSincePush <= 7) activityLevel = "Very active";
  else if (daysSincePush <= 30) activityLevel = "Active";
  else if (daysSincePush <= 180) activityLevel = "Moderate";
  else if (daysSincePush <= 365) activityLevel = "Low";
  else activityLevel = "Inactive";

  // Documentation indicators — from the real root-directory listing.
  let docFlags = null;
  if (Array.isArray(contents)) {
    const names = contents
      .filter((entry) => entry && entry.type === "file")
      .map((entry) => entry.name.toLowerCase());
    const hasMatch = (patterns) => names.some((n) => patterns.some((p) => p.test(n)));
    docFlags = {
      readme: hasMatch([/^readme(\.|$)/]),
      license: Boolean(repo.license) || hasMatch([/^license(\.|$)/, /^licence(\.|$)/]),
      contributing: hasMatch([/^contributing(\.|$)/]),
      security: hasMatch([/^security(\.|$)/]),
      gitignore: hasMatch([/^\.gitignore$/]),
    };
  }

  // Maintenance indicators
  const openPullCountRaw = Array.isArray(openPulls) ? openPulls.length : null;
  const pullsCountIsCapped = openPullCountRaw === 100; // per_page cap — exact total unknown beyond this
  const openPullCount =
    openPullCountRaw == null ? null : pullsCountIsCapped ? "100+" : String(openPullCountRaw);
  const openIssuesOnly =
    openPullCountRaw != null && !pullsCountIsCapped && typeof repo.open_issues_count === "number"
      ? Math.max(repo.open_issues_count - openPullCountRaw, 0)
      : null;

  // Release maturity — "known" whenever we can say for certain either
  // that a release exists or that none does (a confirmed 404).
  let releaseKnown = false;
  let hasRelease = false;
  if (releaseResult && !releaseResult.failed) {
    releaseKnown = true;
    hasRelease = Boolean(releaseResult.data && releaseResult.data.tag_name);
  } else if (releaseResult && releaseResult.failed && releaseResult.error && releaseResult.error.type === "not_found") {
    releaseKnown = true;
    hasRelease = false;
  }

  return {
    ageDays,
    ageLabel: formatDuration(ageDays),
    daysSincePush,
    lastPushLabel: relativeTime(repo.pushed_at),
    lastUpdateLabel: relativeTime(repo.updated_at),
    activityLevel,
    docFlags,
    openPullCount,
    openIssuesOnly,
    releaseKnown,
    hasRelease,
  };
}

function computeLanguagePercentages(languages) {
  if (!languages || typeof languages !== "object") return [];
  const total = Object.values(languages).reduce((sum, v) => sum + v, 0);
  if (!total) return [];
  return Object.entries(languages)
    .map(([name, bytes]) => ({ name, bytes, pct: (bytes / total) * 100 }))
    .sort((a, b) => b.bytes - a.bytes);
}

const LANG_COLORS = [
  "#e8a33d", "#4fb477", "#5a8fd6", "#c46bd6", "#e5534b",
  "#3fc2c9", "#c9a15a", "#7d8ac9", "#9aa1ad",
];

/* ============================== Step 5b =============================
   Repository score (heuristic, out of 100) and negative-points list.
   Every input is a real value already computed above — categories
   whose underlying data is unavailable are excluded from the total
   rather than guessed, and the final score is renormalized against
   only the weight actually available.
   ===================================================================== */

function computeScore(repo, analysis) {
  const rows = [];

  // 1. Activity & freshness — always available (core repo data).
  let activityPts;
  if (repo.archived) activityPts = 0;
  else if (analysis.daysSincePush <= 7) activityPts = 25;
  else if (analysis.daysSincePush <= 30) activityPts = 20;
  else if (analysis.daysSincePush <= 90) activityPts = 14;
  else if (analysis.daysSincePush <= 180) activityPts = 8;
  else if (analysis.daysSincePush <= 365) activityPts = 3;
  else activityPts = 0;
  rows.push({ label: "Activity & freshness", earned: activityPts, max: 25, available: true });

  // 2. Community traction — always available (core repo data), log-scaled.
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const starsPts = Math.round(Math.min(14, (Math.log10(stars + 1) / 5) * 14));
  const forksPts = Math.round(Math.min(6, (Math.log10(forks + 1) / 4) * 6));
  rows.push({ label: "Community traction", earned: starsPts + forksPts, max: 20, available: true });

  // 3. Documentation completeness — needs the root-contents listing.
  if (analysis.docFlags) {
    const d = analysis.docFlags;
    const docPts = (d.readme ? 10 : 0) + (d.license ? 5 : 0) + (d.contributing ? 3 : 0) + (d.security ? 2 : 0);
    rows.push({ label: "Documentation", earned: docPts, max: 20, available: true });
  } else {
    rows.push({ label: "Documentation", earned: 0, max: 20, available: false });
  }

  // 4. Repo hygiene — always available (core repo data).
  const hygienePts = (repo.description ? 5 : 0) + ((repo.topics || []).length > 0 ? 5 : 0);
  rows.push({ label: "Repo hygiene", earned: hygienePts, max: 10, available: true });

  // 5. Issue backlog health — needs open-PR data to isolate real issues.
  if (analysis.openIssuesOnly != null) {
    const n = analysis.openIssuesOnly;
    let issuePts;
    if (n <= 5) issuePts = 15;
    else if (n <= 20) issuePts = 11;
    else if (n <= 50) issuePts = 7;
    else if (n <= 150) issuePts = 3;
    else issuePts = 0;
    rows.push({ label: "Issue backlog", earned: issuePts, max: 15, available: true });
  } else {
    rows.push({ label: "Issue backlog", earned: 0, max: 15, available: false });
  }

  // 6. Release maturity — available whenever we could confirm either a
  //    real latest release or a confirmed absence of releases (404).
  if (analysis.releaseKnown) {
    rows.push({ label: "Release maturity", earned: analysis.hasRelease ? 10 : 0, max: 10, available: true });
  } else {
    rows.push({ label: "Release maturity", earned: 0, max: 10, available: false });
  }

  const availableMax = rows.reduce((sum, r) => sum + (r.available ? r.max : 0), 0);
  const earnedTotal = rows.reduce((sum, r) => sum + (r.available ? r.earned : 0), 0);
  const total = availableMax > 0 ? Math.round((earnedTotal / availableMax) * 100) : null;
  const fullCoverage = availableMax === rows.reduce((sum, r) => sum + r.max, 0);

  return { total, rows, availableMax, earnedTotal, fullCoverage };
}

function scoreGrade(total) {
  if (total == null) return { label: "Not enough data", cls: "" };
  if (total >= 85) return { label: "Excellent", cls: "good" };
  if (total >= 70) return { label: "Good", cls: "good" };
  if (total >= 50) return { label: "Fair", cls: "warn" };
  if (total >= 30) return { label: "Weak", cls: "bad" };
  return { label: "Poor", cls: "bad" };
}

function computeNegatives(repo, analysis) {
  const negatives = [];

  if (repo.archived) {
    negatives.push("This repository is archived and is no longer actively maintained.");
  }
  if (!repo.archived && analysis.daysSincePush > 365) {
    negatives.push(`No commits pushed to the default branch in ${analysis.ageDays >= analysis.daysSincePush ? formatDuration(analysis.daysSincePush) : "over a year"} — the project may be unmaintained.`);
  } else if (!repo.archived && analysis.daysSincePush > 180) {
    negatives.push(`No push activity in the last ${formatDuration(analysis.daysSincePush)}.`);
  }

  if (analysis.docFlags) {
    if (!analysis.docFlags.readme) negatives.push("No README file in the repository root — new users have nothing to orient them.");
    if (!analysis.docFlags.license) negatives.push("No LICENSE detected — usage and reuse rights are unclear.");
    if (!analysis.docFlags.contributing) negatives.push("No CONTRIBUTING guide found.");
    if (!analysis.docFlags.security) negatives.push("No SECURITY policy found for reporting vulnerabilities.");
    if (!analysis.docFlags.gitignore) negatives.push("No .gitignore file found.");
  }

  if (!repo.description) negatives.push("No repository description set.");
  if (!(repo.topics && repo.topics.length)) negatives.push("No topics/tags set, which limits discoverability.");

  if (analysis.openIssuesOnly != null && analysis.openIssuesOnly > 50) {
    negatives.push(`Large open-issue backlog (${analysis.openIssuesOnly} calculated) relative to typical maintenance capacity.`);
  }
  if (analysis.openPullCount != null && analysis.openPullCount !== "0" && Number(analysis.openPullCount.replace("+", "")) >= 30) {
    negatives.push(`${analysis.openPullCount} open pull requests waiting on review/merge.`);
  }

  if (analysis.releaseKnown && !analysis.hasRelease) {
    negatives.push("No published releases — there's no tagged, versioned artifact to consume.");
  }

  if (!repo.archived && stars_forks_low(repo, analysis)) {
    negatives.push(`Limited community adoption so far (${repo.stargazers_count} star${repo.stargazers_count === 1 ? "" : "s"}, ${repo.forks_count} fork${repo.forks_count === 1 ? "" : "s"}).`);
  }

  return negatives;
}

function stars_forks_low(repo, analysis) {
  return analysis.ageDays > 90 && repo.stargazers_count < 5 && repo.forks_count < 2;
}

/* ============================== Step 6 ==============================
   Rendering helpers — everything built with textContent, never
   innerHTML with interpolated data, so nothing from the API can be
   mis-rendered as markup.
   ===================================================================== */

function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.text !== undefined) node.textContent = opts.text;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  }
  return node;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function setLoading(message) {
  loadingText.textContent = message;
}

function showLoading(message) {
  errorState.hidden = true;
  results.hidden = true;
  loadingState.hidden = false;
  setLoading(message);
}

function showError(title, message) {
  loadingState.hidden = true;
  results.hidden = true;
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  errorState.hidden = false;
}

function hideAllStates() {
  loadingState.hidden = true;
  errorState.hidden = true;
  results.hidden = true;
}

/* ---- section renderers ---- */

function renderBanner(repo, isCached, fetchedAt) {
  const badge = document.getElementById("data-source-badge");
  const fetchedEl = document.getElementById("fetched-at");
  const link = document.getElementById("repo-link");

  badge.textContent = isCached ? "Data source: GitHub API (cached)" : "Data source: GitHub API";
  badge.classList.toggle("cached", isCached);
  fetchedEl.textContent = `Last fetched: ${relativeTime(new Date(fetchedAt).toISOString())} at ${new Date(fetchedAt).toLocaleTimeString()}`;
  link.href = repo.html_url;
  link.textContent = repo.html_url;
}

function renderIdentity(repo) {
  const avatar = document.getElementById("owner-avatar");
  avatar.src = repo.owner.avatar_url || "";
  avatar.alt = `${repo.owner.login} avatar`;

  document.getElementById("repo-owner").textContent = repo.owner.login;
  document.getElementById("repo-name").textContent = repo.name;
  document.getElementById("repo-description").textContent =
    repo.description || "No description provided.";

  const badgeRow = document.getElementById("badge-row");
  clear(badgeRow);
  const chips = [];
  chips.push({ text: repo.visibility || (repo.private ? "private" : "public"), cls: repo.private ? "private" : "" });
  if (repo.archived) chips.push({ text: "archived", cls: "archived" });
  if (repo.fork) chips.push({ text: "fork", cls: "" });
  if (repo.language) chips.push({ text: repo.language, cls: "" });
  if (repo.license && repo.license.spdx_id && repo.license.spdx_id !== "NOASSERTION") {
    chips.push({ text: repo.license.spdx_id, cls: "" });
  }
  (repo.topics || []).slice(0, 6).forEach((t) => chips.push({ text: t, cls: "" }));

  chips.forEach((c) => {
    badgeRow.appendChild(el("span", { class: `chip ${c.cls}`.trim(), text: c.text }));
  });
}

function renderScore(repo, analysis) {
  const score = computeScore(repo, analysis);
  const numberEl = document.getElementById("score-number");
  const dialEl = document.getElementById("score-dial");
  const gradeEl = document.getElementById("score-grade");
  const coverageEl = document.getElementById("score-coverage");
  const breakdownEl = document.getElementById("score-breakdown");

  numberEl.textContent = score.total == null ? "–" : String(score.total);
  const grade = scoreGrade(score.total);
  gradeEl.textContent = grade.label;
  gradeEl.className = `score-grade ${grade.cls}`.trim();
  dialEl.style.borderColor =
    grade.cls === "good" ? "var(--good)" : grade.cls === "bad" ? "var(--bad)" : "var(--accent)";

  coverageEl.textContent = score.fullCoverage
    ? "Based on all 6 scoring categories."
    : `Based on ${score.rows.filter((r) => r.available).length} of ${score.rows.length} categories — the rest were excluded, not guessed, because that data wasn't available.`;

  clear(breakdownEl);
  score.rows.forEach((r) => {
    const row = el("div", { class: "score-row" });
    row.appendChild(el("span", { class: "score-row-label", text: r.label }));
    const track = el("div", { class: "score-row-track" });
    const pct = r.available ? (r.earned / r.max) * 100 : 0;
    const fill = el("span", { class: `score-row-fill ${r.available ? "" : "na"}`.trim(), attrs: { style: `width:${r.available ? pct : 100}%` } });
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(
      el("span", { class: "score-row-value", text: r.available ? `${r.earned}/${r.max}` : "n/a" })
    );
    breakdownEl.appendChild(row);
  });
}

function renderNegatives(repo, analysis) {
  const list = document.getElementById("negatives-list");
  clear(list);
  const negatives = computeNegatives(repo, analysis);
  if (!negatives.length) {
    list.appendChild(
      el("li", { class: "none", text: "No notable weaknesses detected from the available GitHub data." })
    );
    return;
  }
  negatives.forEach((text) => list.appendChild(el("li", { text })));
}

function renderStats(repo, analysis) {
  const grid = document.getElementById("stat-grid");
  clear(grid);
  const stats = [
    ["Stars", repo.stargazers_count.toLocaleString()],
    ["Forks", repo.forks_count.toLocaleString()],
    ["Watchers", repo.subscribers_count != null ? repo.subscribers_count.toLocaleString() : repo.watchers_count.toLocaleString()],
    [
      analysis.openIssuesOnly != null ? "Open issues (calc.)" : "Open issues + PRs",
      analysis.openIssuesOnly != null ? analysis.openIssuesOnly.toLocaleString() : repo.open_issues_count.toLocaleString(),
    ],
    ["Open PRs", analysis.openPullCount != null ? analysis.openPullCount : "unavailable"],
    ["Size", repo.size >= 1024 ? `${(repo.size / 1024).toFixed(1)} MB` : `${repo.size} KB`],
    ["Default branch", repo.default_branch],
    ["Created", new Date(repo.created_at).toLocaleDateString()],
    ["Repo age", analysis.ageLabel + " (calculated)"],
    ["Last push", analysis.lastPushLabel],
  ];
  stats.forEach(([label, value]) => {
    const stat = el("div", { class: "stat" });
    stat.appendChild(el("span", { class: "stat-value", text: String(value) }));
    stat.appendChild(el("span", { class: "stat-label", text: label }));
    grid.appendChild(stat);
  });
}

function renderLanguages(languagesResult) {
  const container = document.getElementById("language-content");
  clear(container);

  if (languagesResult.failed) {
    container.appendChild(el("p", { class: "empty-note", text: "Language data unavailable right now." }));
    return;
  }
  const langs = computeLanguagePercentages(languagesResult.data);
  if (!langs.length) {
    container.appendChild(el("p", { class: "empty-note", text: "GitHub has no language data for this repository." }));
    return;
  }

  const bar = el("div", { class: "lang-bar" });
  langs.forEach((l, i) => {
    const seg = el("span", { attrs: { style: `width:${l.pct}%;background:${LANG_COLORS[i % LANG_COLORS.length]}` } });
    bar.appendChild(seg);
  });
  container.appendChild(bar);

  const legend = el("div", { class: "lang-legend" });
  langs.slice(0, 8).forEach((l, i) => {
    const row = el("div", { class: "lang-row" });
    const dot = el("span", { class: "lang-dot", attrs: { style: `background:${LANG_COLORS[i % LANG_COLORS.length]}` } });
    row.appendChild(dot);
    row.appendChild(el("span", { class: "lang-name", text: l.name }));
    row.appendChild(el("span", { class: "lang-pct", text: `${l.pct.toFixed(1)}%` }));
    legend.appendChild(row);
  });
  container.appendChild(legend);
}

function renderDocs(analysis) {
  const list = document.getElementById("docs-list");
  clear(list);
  const labels = [
    ["readme", "README"],
    ["license", "LICENSE"],
    ["contributing", "CONTRIBUTING"],
    ["security", "SECURITY policy"],
    ["gitignore", ".gitignore"],
  ];

  if (!analysis.docFlags) {
    list.appendChild(el("li", { class: "empty-note", text: "Repository contents unavailable — indicators could not be checked." }));
    return;
  }

  labels.forEach(([key, name]) => {
    const present = analysis.docFlags[key];
    const li = el("li");
    li.appendChild(el("span", { class: `docs-mark ${present ? "yes" : "no"}`, text: present ? "✓" : "–" }));
    li.appendChild(el("span", { class: `docs-name ${present ? "" : "no"}`, text: name }));
    list.appendChild(li);
  });
}

function renderHealth(repo, analysis) {
  const container = document.getElementById("health-content");
  clear(container);

  const rows = [];
  rows.push(["Activity level", analysis.activityLevel, activityClass(analysis.activityLevel)]);
  rows.push(["Last push", `${analysis.lastPushLabel} (calculated)`, ""]);
  rows.push(["Last metadata update", analysis.lastUpdateLabel, ""]);
  rows.push(["Archived", repo.archived ? "Yes" : "No", repo.archived ? "bad" : "good"]);
  rows.push(["Has issues enabled", repo.has_issues ? "Yes" : "No", ""]);
  rows.push([
    "Open issues (excl. PRs)",
    analysis.openIssuesOnly != null ? `${analysis.openIssuesOnly} (calculated)` : "unavailable",
    "",
  ]);

  rows.forEach(([label, value, cls]) => {
    const row = el("div", { class: "health-row" });
    row.appendChild(el("span", { class: "health-label", text: label }));
    row.appendChild(el("span", { class: `health-value ${cls}`.trim(), text: value }));
    container.appendChild(row);
  });
}

function activityClass(level) {
  if (level === "Very active" || level === "Active") return "good";
  if (level === "Moderate") return "warn";
  return level === "Inactive" || level === "Archived" ? "bad" : "";
}

function renderContributors(contributorsResult) {
  const container = document.getElementById("contributors-content");
  clear(container);

  if (contributorsResult.failed) {
    container.appendChild(el("p", { class: "empty-note", text: "Contributor data unavailable right now." }));
    return;
  }
  const contributors = Array.isArray(contributorsResult.data) ? contributorsResult.data : [];
  if (!contributors.length) {
    container.appendChild(el("p", { class: "empty-note", text: "No contributor data returned by GitHub." }));
    return;
  }

  contributors
    .filter((c) => c && c.login)
    .sort((a, b) => (b.contributions || 0) - (a.contributions || 0))
    .slice(0, 5)
    .forEach((c) => {
      const row = el("div", { class: "contrib-row" });
      const avatar = el("img", { class: "contrib-avatar", attrs: { src: c.avatar_url || "", alt: "" } });
      row.appendChild(avatar);
      row.appendChild(el("span", { class: "contrib-name", text: c.login }));
      row.appendChild(el("span", { class: "contrib-count", text: `${c.contributions} commits` }));
      container.appendChild(row);
    });

  if (contributors.length === 100) {
    container.appendChild(el("p", { class: "empty-note", text: "Showing top 5 of 100+ contributors returned by GitHub." }));
  }
}

function renderCommits(commitsResult) {
  const list = document.getElementById("commits-list");
  clear(list);

  if (commitsResult.failed) {
    list.appendChild(el("li", { class: "empty-note", text: "Recent commit data unavailable right now." }));
    return;
  }
  const commits = Array.isArray(commitsResult.data) ? commitsResult.data : [];
  if (!commits.length) {
    list.appendChild(el("li", { class: "empty-note", text: "No commits returned for the default branch." }));
    return;
  }

  commits.forEach((c) => {
    const li = el("li");
    const message = (c.commit && c.commit.message) ? c.commit.message.split("\n")[0] : "(no message)";
    const authorName = (c.commit && c.commit.author && c.commit.author.name) || (c.author && c.author.login) || "unknown";
    const date = (c.commit && c.commit.author && c.commit.author.date) ? relativeTime(c.commit.author.date) : "";
    const sha = c.sha ? c.sha.slice(0, 7) : "";
    li.appendChild(el("p", { class: "commit-msg", text: message }));
    li.appendChild(el("p", { class: "commit-meta", text: `${sha}  ·  ${authorName}  ·  ${date}` }));
    list.appendChild(li);
  });
}

function renderRelease(releaseResult) {
  const container = document.getElementById("release-content");
  clear(container);

  if (releaseResult.failed) {
    if (releaseResult.error && releaseResult.error.type === "not_found") {
      container.appendChild(el("p", { class: "empty-note", text: "This repository has no published releases." }));
    } else {
      container.appendChild(el("p", { class: "empty-note", text: "Release data unavailable right now." }));
    }
    return;
  }
  const release = releaseResult.data;
  if (!release || !release.tag_name) {
    container.appendChild(el("p", { class: "empty-note", text: "This repository has no published releases." }));
    return;
  }
  container.appendChild(el("p", { class: "release-name", text: release.name || release.tag_name }));
  container.appendChild(
    el("p", {
      class: "release-meta",
      text: `${release.tag_name}  ·  published ${relativeTime(release.published_at || release.created_at)}`,
    })
  );
}

/* ============================== Step 7 ==============================
   Orchestration
   ===================================================================== */

let inFlight = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (inFlight) return;

  let parsed;
  try {
    parsed = parseGitHubUrl(input.value);
  } catch (err) {
    hideAllStates();
    showError("Invalid GitHub URL", err.message);
    return;
  }

  inFlight = true;
  analyzeBtn.disabled = true;
  hideAllStates();
  showLoading(`Looking up ${parsed.owner}/${parsed.repo} on GitHub…`);

  try {
    await runAnalysis(parsed.owner, parsed.repo);
  } catch (err) {
    renderErrorFromException(err, parsed);
  } finally {
    inFlight = false;
    analyzeBtn.disabled = false;
  }
});

function renderErrorFromException(err, parsed) {
  hideAllStates();
  if (err instanceof GitHubApiError) {
    if (err.type === "not_found") {
      showError(
        "Repository not found",
        `GitHub has no public repository at ${parsed.owner}/${parsed.repo}, or it's private. Public repositories work without a token; private repositories require GitHub authentication/access, which this tool does not perform.`
      );
      return;
    }
    if (err.type === "rate_limit") {
      showError("GitHub API rate limit reached", err.message);
      return;
    }
    if (err.type === "network") {
      showError("Network error", err.message);
      return;
    }
    showError("GitHub API error", err.message);
    return;
  }
  showError(
    "Unexpected error",
    "Something went wrong while analyzing this repository. Please verify the URL and try again."
  );
}

async function runAnalysis(owner, repo) {
  const cached = readCache(owner, repo);

  let repoData, languagesResult, contributorsResult, commitsResult, contentsResult, pullsResult, releaseResult;
  let fetchedAt;
  let isCached = false;

  if (cached) {
    isCached = true;
    fetchedAt = cached.timestamp;
    ({ repoData, languagesResult, contributorsResult, commitsResult, contentsResult, pullsResult, releaseResult } = cached.bundle);
  } else {
    setLoading(`Fetching ${owner}/${repo} from the GitHub API…`);
    repoData = await fetchRepository(owner, repo); // throws on 404 / rate limit / network

    validateRepoShape(repoData);

    if (repoData.private) {
      throw new GitHubApiError(
        "not_found",
        "Private repositories require GitHub authentication/access, which this tool does not perform."
      );
    }

    setLoading("Fetching languages, contributors, commits, contents, pull requests, releases…");

    [languagesResult, contributorsResult, commitsResult, contentsResult, pullsResult, releaseResult] =
      await Promise.all([
        fetchLanguages(owner, repo),
        fetchContributors(owner, repo),
        fetchCommits(owner, repo),
        fetchRootContents(owner, repo),
        fetchOpenPulls(owner, repo),
        fetchLatestRelease(owner, repo),
      ]);

    fetchedAt = Date.now();
    writeCache(owner, repo, {
      repoData,
      languagesResult,
      contributorsResult,
      commitsResult,
      contentsResult,
      pullsResult,
      releaseResult,
    });
  }

  const contentsArray = contentsResult.failed ? null : contentsResult.data;
  const pullsArray = pullsResult.failed ? null : pullsResult.data;

  const analysis = analyzeRepository(repoData, contentsArray, pullsArray, releaseResult);

  renderBanner(repoData, isCached, fetchedAt);
  renderIdentity(repoData);
  renderScore(repoData, analysis);
  renderStats(repoData, analysis);
  renderLanguages(languagesResult);
  renderDocs(analysis);
  renderHealth(repoData, analysis);
  renderContributors(contributorsResult);
  renderNegatives(repoData, analysis);
  renderCommits(commitsResult);
  renderRelease(releaseResult);

  hideAllStates();
  results.hidden = false;
}
