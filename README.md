<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:05070D,25:0B1020,50:111A35,75:182B4A,100:00E5FF&height=230&section=header&text=RepoLens&fontSize=58&fontColor=FFFFFF&fontAlignY=38&animation=twinkling&desc=Real%20GitHub%20Data%20%7C%20Transparent%20Repository%20Analysis%20%7C%20Zero%20Mock%20Data&descAlignY=62&descSize=16&descColor=9FEFFF" width="100%" alt="RepoLens animated banner"/>

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=18&duration=2600&pause=900&color=00E5FF&center=true&vCenter=true&width=820&lines=Analyze+Any+Public+GitHub+Repository;Fetch+Real-Time+Repository+Data;Calculate+a+Transparent+Score+Out+of+100;Inspect+Languages%2C+Contributors%2C+Activity+%26+Docs;No+Mock+Data.+No+Fake+Statistics.+No+Backend." alt="RepoLens typing animation"/>

<br/>

[![LIVE DEMO](https://img.shields.io/badge/%E2%9A%A1%20LIVE%20DEMO-RepoLens-00E5FF?style=for-the-badge\&labelColor=05070D)](https://repolens-lite.netlify.app)
[![GitHub](https://img.shields.io/badge/GitHub-MUdevelops-181717?style=for-the-badge\&logo=github)](https://github.com/MUdevelops/RepoLens)
[![MIT License](https://img.shields.io/badge/License-MIT-00D084?style=for-the-badge)](./LICENSE)
[![No Backend](https://img.shields.io/badge/Backend-Zero-8B5CF6?style=for-the-badge)](#-technology)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)](#-technology)

<br/>

### 🔍 Real Repository Intelligence — Directly from GitHub

**Paste a public GitHub repository URL → Analyze → Understand → Score**

<br/>

**Built by [Muhammad Umar Jamal](https://github.com/MUdevelops)**
*AI Application Engineer • Developer • Builder*

</div>

---

## 🌐 Live Demo

<div align="center">

### 🚀 [Open RepoLens](https://repolens-lite.netlify.app)

**Try it with any public GitHub repository.**

`facebook/react` · `torvalds/linux` · `MUdevelops/RepoLens`

</div>

---

## 🧠 What is RepoLens?

**RepoLens** is a lightweight, client-side GitHub repository analyzer that retrieves **real repository information directly from the GitHub REST API** and converts it into an easy-to-understand analysis.

It can inspect:

* ⭐ Stars
* 🍴 Forks
* 💻 Repository size
* 🧑‍💻 Contributors
* 📝 Recent commits
* 🌐 Language distribution
* 📚 Documentation files
* 🐛 Issue backlog
* 🔀 Open pull requests
* 🚀 Latest releases
* 📊 Repository activity
* 🧮 Overall heuristic score

### The Core Principle

> **If GitHub doesn't provide the data, RepoLens doesn't invent it.**

There are:

* ❌ No hardcoded repository statistics
* ❌ No fake charts
* ❌ No demo repository fallback
* ❌ No fabricated contributors
* ❌ No artificial scores
* ❌ No backend database

Everything displayed is either obtained from GitHub or mathematically derived from GitHub data.

---

# ✨ Features

<table>
<tr>
<td width="50%">

### 🔎 Live Repository Analysis

Analyze public GitHub repositories using live API responses.

### 🧮 Transparent 100-Point Score

A documented heuristic score based on measurable repository characteristics.

### 📊 Repository Statistics

View stars, forks, size, issues, pull requests and other core metrics.

### 🌐 Language Distribution

Analyze the programming languages detected by GitHub.

### 👥 Contributor Analysis

See the repository's leading contributors.

### 🕒 Recent Activity

Inspect recent commits and repository activity.

</td>

<td width="50%">

### 📚 Documentation Indicators

Detect important files such as:

`README` · `LICENSE` · `CONTRIBUTING` · `SECURITY` · `.gitignore`

### 🚀 Release Information

Display the latest published release when available.

### ⚠️ Negative Points

Identify measurable repository weaknesses.

### 🛡️ Honest Error Handling

404s, private repositories, API failures and rate limits are surfaced instead of replaced with fake data.

### ⚡ Client-Side Caching

Recently analyzed repositories can be cached locally for a limited period.

### ♿ Responsive & Accessible

Designed for desktop, tablet and mobile layouts.

</td>
</tr>
</table>

---

# 📸 Product Showcase

<div align="center">

## ✨ Splash Screen

<img src="./Screenshots/Splash%20Screen.png" width="900" alt="RepoLens Splash Screen"/>

<br/><br/>

## 🔍 Search Your GitHub Repository

<img src="./Screenshots/Search%20your%20Github%20Repo.png" width="900" alt="Search your GitHub Repository"/>

<br/><br/>

## ✅ Repository Fetched Successfully

<img src="./Screenshots/Fetched%20Successfully.png" width="900" alt="Repository fetched successfully"/>

</div>

---

# 📊 Repository Analytics

<div align="center">

## 📈 Repository Statistics

<img src="./Screenshots/Repo%20Statistics.png" width="900" alt="RepoLens Repository Statistics"/>

<br/><br/>

## 🏆 Repository Score — Out of 100

<img src="./Screenshots/Repository%20Score%20out%20of%20100.png" width="900" alt="Repository score out of 100"/>

<br/><br/>

## 🌐 Language Distribution

<img src="./Screenshots/Language%20Distribution.png" width="900" alt="Language Distribution"/>

</div>

---

# 👥 Community & Activity

<div align="center">

## 👨‍💻 Top Contributors

<img src="./Screenshots/Top%20Contributers.png" width="900" alt="Top Contributors"/>

<br/><br/>

## 🕒 Recent Activities

<img src="./Screenshots/Recent%20Activities.png" width="900" alt="Recent Repository Activities"/>

<br/><br/>

## 🚀 Latest Releases

<img src="./Screenshots/Latest%20Releases.png" width="900" alt="Latest Releases"/>

</div>

---

# 📚 Repository Quality

<div align="center">

## 📖 Documentation Indicators

<img src="./Screenshots/Documentation%20Indicators.png" width="900" alt="Documentation Indicators"/>

<br/><br/>

## ⚠️ Negative Points

<img src="./Screenshots/Negative%20Points.png" width="900" alt="Negative Points"/>

</div>

---

# 🧮 How RepoLens Calculates the Score

RepoLens produces a **heuristic score from 0–100**.

It is **not an official GitHub metric**.

The score is calculated from six measurable categories:

| Category               | Weight | Data Used                               |
| ---------------------- | :----: | --------------------------------------- |
| ⚡ Activity & Freshness | **25** | Last push date + archived status        |
| ⭐ Community Traction   | **20** | Stars + forks                           |
| 📚 Documentation       | **20** | README, LICENSE, CONTRIBUTING, SECURITY |
| 🧹 Repository Hygiene  | **10** | Description + topics                    |
| 🐛 Issue Backlog       | **15** | Open issues excluding pull requests     |
| 🚀 Release Maturity    | **10** | Published release availability          |

### 🧠 Important Design Decision

If one of the secondary GitHub API requests fails, RepoLens does **not** replace the missing information with a guess.

Instead:

```text
Unavailable category
        ↓
Excluded from calculation
        ↓
Remaining weights are normalized
        ↓
Score remains based only on known data
```

The interface also communicates how many scoring categories were successfully evaluated.

---

# 🔌 GitHub REST API

RepoLens communicates directly with GitHub's public REST API.

| API Endpoint                             | Purpose                 |
| ---------------------------------------- | ----------------------- |
| `/repos/{owner}/{repo}`                  | Repository metadata     |
| `/repos/{owner}/{repo}/languages`        | Language statistics     |
| `/repos/{owner}/{repo}/contributors`     | Contributor information |
| `/repos/{owner}/{repo}/commits`          | Recent commits          |
| `/repos/{owner}/{repo}/contents/`        | Documentation detection |
| `/repos/{owner}/{repo}/pulls?state=open` | Open pull requests      |
| `/repos/{owner}/{repo}/releases/latest`  | Latest release          |

### 🔐 No GitHub Token Required

RepoLens is designed as a static client-side application.

```text
User
 │
 ▼
RepoLens
 │
 ▼
GitHub REST API
 │
 ▼
Real Repository Data
 │
 ▼
Analysis + Scoring
 │
 ▼
Visual Dashboard
```

**No application server.**
**No database.**
**No secret environment variables.**

---

# 🛠️ Technology

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge\&logo=html5\&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge\&logo=css3\&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)
![GitHub REST API](https://img.shields.io/badge/GitHub_REST_API-181717?style=for-the-badge\&logo=github\&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge\&logo=netlify\&logoColor=white)

</div>

### Architecture

```text
HTML
 │
 ├── Application Interface
 │
 ├── Repository Input
 │
 └── Dashboard Structure

CSS
 │
 ├── Responsive Layout
 ├── Visual System
 └── Animations

JavaScript
 │
 ├── GitHub URL Parsing
 ├── REST API Requests
 ├── Data Validation
 ├── Score Calculation
 ├── Caching
 └── Dashboard Rendering

GitHub REST API
 │
 └── Real Repository Data

Netlify
 │
 └── Static Deployment
```

### No Framework Required

RepoLens intentionally avoids unnecessary complexity:

* No React
* No Vue
* No Angular
* No Node backend
* No database
* No build pipeline
* No npm dependency requirement

**Plain HTML + CSS + JavaScript + GitHub REST API.**

---

# 📂 Project Structure

```text
RepoLens/
│
├── 📁 Screenshots/
│   ├── Documentation Indicators.png
│   ├── Fetched Successfully.png
│   ├── Language Distribution.png
│   ├── Latest Releases.png
│   ├── Negative Points.png
│   ├── Recent Activities.png
│   ├── Repo Statistics.png
│   ├── Repository Score out of 100.png
│   ├── Search your Github Repo.png
│   ├── Splash Screen.png
│   └── Top Contributers.png
│
├── 📄 index.html
├── 🎨 style.css
├── ⚙️ app.js
├── ☁️ netlify.toml
├── 📜 LICENSE
└── 📖 README.md
```

---

# ⚡ Run Locally

RepoLens requires no build process.

```bash
git clone https://github.com/MUdevelops/RepoLens.git
cd RepoLens
npx serve .
```

Then open the local URL generated by the server.

Alternatively, because the project is static, you can open `index.html` directly in a browser.

---

# ☁️ Deploy to Netlify

RepoLens is designed for static deployment.

### Option 1 — Netlify

1. Import the GitHub repository into Netlify.
2. Select the repository.
3. Use the project root as the publish directory.
4. No build command is required.
5. Deploy.

### Option 2 — Netlify Drop

Drag the project folder into Netlify Drop.

**No backend configuration is required.**

---

# 🧪 What Makes RepoLens Different?

RepoLens was designed around one simple engineering principle:

<div align="center">

### **REAL DATA > FAKE DEMOS**

</div>

Traditional portfolio-style analyzer demos can display impressive statistics using static sample data.

RepoLens takes another approach.

| ❌ Avoided                | ✅ Implemented              |
| ------------------------ | -------------------------- |
| Hardcoded statistics     | Live GitHub API data       |
| Fake repositories        | User-provided repositories |
| Fake contributors        | GitHub contributor data    |
| Fake language charts     | GitHub language API        |
| Silent API failures      | Explicit error states      |
| Artificial fallback data | Honest unavailable states  |
| Backend infrastructure   | Client-side architecture   |

### Data Integrity Rule

> **Every displayed number must come from GitHub or be mathematically derived from GitHub data.**

This makes RepoLens not just a visual dashboard, but an exercise in **API integration, data validation, error handling, scoring logic, and frontend engineering**.

---

# 🎯 Engineering Concepts Demonstrated

RepoLens demonstrates practical software-engineering concepts including:

```text
REST API Integration
       ↓
Asynchronous JavaScript
       ↓
Data Validation
       ↓
Error Handling
       ↓
Data Transformation
       ↓
Heuristic Scoring
       ↓
Client-Side Caching
       ↓
Responsive UI
       ↓
Accessible Interaction
       ↓
Static Cloud Deployment
```

### Skills Demonstrated

* JavaScript API integration
* REST API consumption
* Asynchronous programming
* JSON data processing
* Error-state design
* Algorithmic scoring
* Frontend architecture
* Responsive UI
* Accessibility
* Client-side caching
* Git/GitHub workflow
* Netlify deployment

---

# 🚧 Future Ideas

Potential future improvements include:

* 📊 Historical repository analysis
* 📈 Score history charts
* 🔄 Repository comparison
* 🏷️ Advanced topic analysis
* 🧠 AI-generated repository explanations
* 📦 Dependency analysis
* 🔐 Optional authenticated GitHub API mode
* 📱 Enhanced mobile dashboard
* 📤 Export analysis as PDF/JSON
* 🔗 Shareable analysis URLs

---

# 🤝 Contributing

Contributions are welcome.

If you want to introduce a new metric or scoring category, explain:

1. Which GitHub API field is being used.
2. How the value is calculated.
3. Why the metric is relevant.
4. How API failure should be handled.

### Golden Rule

> **No invented data.**

---

# 📄 License

This project is released under the **MIT License**.

See [`LICENSE`](./LICENSE) for details.

---

# 👨‍💻 Author

<div align="center">

<img src="https://github.com/MUdevelops.png" width="110" height="110" style="border-radius:50%;" alt="Muhammad Umar Jamal"/>

### Muhammad Umar Jamal

**AI Application Engineer • Developer • Builder**

<a href="https://github.com/MUdevelops">
<img src="https://img.shields.io/badge/GitHub-MUdevelops-181717?style=for-the-badge&logo=github" alt="GitHub"/>
</a>

<br/><br/>

**Building practical software with APIs, automation, AI and modern development tools.**

</div>

---

<div align="center">

### ⭐ If RepoLens helped you understand a GitHub repository, consider starring the project!

[![Star RepoLens](https://img.shields.io/github/stars/MUdevelops/RepoLens?style=for-the-badge\&logo=github\&label=Star%20RepoLens)](https://github.com/MUdevelops/RepoLens)

<br/>

**RepoLens**

*Real GitHub Data. Transparent Analysis. Zero Mock Data.*

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00E5FF,50:182B4A,100:05070D&height=120&section=footer" width="100%" alt="RepoLens footer"/>

</div>
