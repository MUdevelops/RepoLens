<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F1115,100:1C2029&height=190&section=header&text=RepoLens&fontSize=48&fontColor=E8A33D&fontAlignY=40&animation=fadeIn&desc=Real%20GitHub%20data.%20Zero%20mock%20data.&descAlignY=62&descSize=17&descColor=E7E9EE" width="100%" alt="RepoLens banner" />

<img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Mono&size=18&duration=2800&pause=1100&color=E8A33D&background=00000000&center=true&vCenter=true&width=720&lines=Paste+a+real+GitHub+repo+URL...;Get+a+live%2C+scored+analysis...;No+demo+data.+No+guessing.+Ever." alt="Typing SVG" />

<br/>

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-repolens--lite.netlify.app-e8a33d?style=for-the-badge&logo=netlify&logoColor=white&labelColor=0f1115)](https://repolens-lite.netlify.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-4fb477?style=for-the-badge&labelColor=0f1115)](./LICENSE)
[![No Backend](https://img.shields.io/badge/backend-none-5a8fd6?style=for-the-badge&labelColor=0f1115)](#-tech-stack)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-c46bd6?style=for-the-badge&labelColor=0f1115)](#-tech-stack)

<sub>Built by <a href="https://github.com/MUdevelops">@MUdevelops</a> — Muhammad Umar Jamal</sub>

</div>

<br/>

## ✨ Overview

**RepoLens** is a lightweight, client-side GitHub repository analyzer. Paste a real
repository URL, and it fetches, validates, and scores that repository **live**,
straight from the official GitHub REST API — no sample data, no fabricated
statistics, no offline fallback of any kind. If GitHub can't answer, RepoLens
tells you exactly why instead of pretending.

> 🔴 **[Try it live → repolens-lite.netlify.app](https://repolens-lite.netlify.app)**

<br/>

## 📋 Table of Contents

- [Features](#-features)
- [Live Preview](#-live-preview)
- [How the Score Works](#-how-the-score-works)
- [GitHub API Endpoints Used](#-github-api-endpoints-used)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Deploy Your Own](#️-deploy-your-own)
- [What Makes This Different](#-what-makes-this-different)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

<br/>

## 🚀 Features

| | |
|---|---|
| 🔎 **Real-time analysis** | Every stat comes from a live GitHub API call, computed the moment you hit Analyze. |
| 🧮 **Score out of 100** | A transparent, weighted score across activity, docs, traction, hygiene, issues, and releases. |
| ⚠️ **Negative points** | A grounded list of real weaknesses — stale pushes, missing README/LICENSE, backlog size, and more. |
| 🧾 **Documentation indicators** | Checks the real root directory for README, LICENSE, CONTRIBUTING, SECURITY, `.gitignore`. |
| 🌐 **Language distribution** | Byte-accurate percentages straight from GitHub's languages API. |
| 👥 **Top contributors & recent commits** | Pulled live, not cached demo lists. |
| 🚫 **Honest error states** | Rate limits, private repos, 404s, and network failures each get a clear, specific message — never a silent fallback to fake data. |
| ⚡ **Lightweight caching** | Recently analyzed repos are cached for 5 minutes client-side, and always labeled "cached" so it's never mistaken for a fresh fetch. |
| 🎬 **Animated splash screen** | A short, brand-true loading moment on open — respects `prefers-reduced-motion`. |
| ♿ **Accessible & responsive** | Semantic HTML, keyboard navigation, visible focus states, and a layout that works from phone to desktop. |
| 🔒 **Zero backend, zero database, zero token** | Public repos work with nothing to configure — it's a static site calling a public API. |

<br/>

## 🔴 Live Preview

<div align="center">

### **[repolens-lite.netlify.app](https://repolens-lite.netlify.app)**

Paste any public repository — try `facebook/react`, `torvalds/linux`, or your own.

</div>

<br/>

## 🧮 How the Score Works

RepoLens computes a **heuristic** score out of 100 — clearly labeled as a heuristic,
never presented as an official GitHub metric. It's built from six weighted
categories, each derived only from real API data:

| Category | Weight | Calculated from |
|---|---|---|
| Activity & freshness | 25 | Days since last push, archived status |
| Community traction | 20 | Stars & forks, log-scaled |
| Documentation | 20 | README / LICENSE / CONTRIBUTING / SECURITY presence |
| Repo hygiene | 10 | Description & topics set |
| Issue backlog | 15 | Open issues, calculated excluding pull requests |
| Release maturity | 10 | Whether a tagged release has ever been published |

If a secondary API call fails (rate limit, transient error), **that category is
excluded from the total and the score is renormalized** against only what's
actually known — never silently guessed. The UI always shows how many of the
6 categories the score is based on.

<br/>

## 🔌 GitHub API Endpoints Used

| Endpoint | Purpose |
|---|---|
| `GET /repos/{owner}/{repo}` | Core metadata — stars, forks, size, license, dates, topics |
| `GET /repos/{owner}/{repo}/languages` | Language byte counts → percentages |
| `GET /repos/{owner}/{repo}/contributors` | Top contributors by commit count |
| `GET /repos/{owner}/{repo}/commits` | 5 most recent commits |
| `GET /repos/{owner}/{repo}/contents/` | Root directory listing for doc-file checks |
| `GET /repos/{owner}/{repo}/pulls?state=open` | Open pull request count |
| `GET /repos/{owner}/{repo}/releases/latest` | Latest published release, if any |

All requests are unauthenticated — no `GITHUB_TOKEN`, no server, no secrets.

<br/>

## 🖥️ Tech Stack

![HTML5](https://img.shields.io/badge/HTML5-e34f26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572b6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-f7df1e?style=flat-square&logo=javascript&logoColor=black)
![GitHub API](https://img.shields.io/badge/GitHub_REST_API-181717?style=flat-square&logo=github&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00c7b7?style=flat-square&logo=netlify&logoColor=white)

No frameworks, no bundler, no build step, no npm dependencies.

<br/>

## 📂 Project Structure

```
repolens-lite/
├── index.html      Markup & structure
├── style.css       Styling — no frameworks
├── app.js          URL parsing, GitHub API calls, scoring, rendering
├── netlify.toml    Deployment config
├── LICENSE         MIT
└── README.md
```

<br/>

## ⚡ Getting Started

No install, no build step — it's plain HTML/CSS/JS.

```bash
git clone https://github.com/MUdevelops/repolens-lite.git
cd repolens-lite
npx serve .
```

Open the printed local URL and paste a real GitHub repository.

<br/>

## ☁️ Deploy Your Own

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/MUdevelops/repolens-lite)

Or manually:

1. Drag the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop) — or connect the repo in the Netlify UI.
2. No build command, no environment variables. Publish directory: `.`
3. Open the deployed URL and analyze a real repository.

<br/>

## 🧪 What Makes This Different

Most "GitHub analyzer" demos ship with hardcoded sample repositories that render
instantly and never touch a real API. RepoLens deliberately does the opposite:

- ❌ No hardcoded repositories, statistics, or charts
- ❌ No `catch (error) { showDemoData() }` fallback pattern, anywhere
- ✅ Every number is either copied directly from a GitHub API response or
  mathematically derived from one, and labeled as such
- ✅ Failures — 404, private repo, rate limit, network error — surface as
  clear, specific messages instead of silently degrading

<br/>

## 🤝 Contributing

Issues and pull requests are welcome. If you're proposing a new metric or score
category, please describe exactly which real GitHub API field(s) it's derived
from — this project's one hard rule is **no invented data**.

<br/>

## 📄 License

Released under the [MIT License](./LICENSE).

<br/>

## 👤 Author

**Muhammad Umar Jamal** — AI Application Engineer
[![GitHub](https://img.shields.io/badge/GitHub-MUdevelops-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/MUdevelops)

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1C2029,100:0F1115&height=100&section=footer" width="100%" alt="footer" />
</div>
