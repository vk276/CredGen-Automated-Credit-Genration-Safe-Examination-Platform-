# CredGen — Automated Marksheet & Academic Credit Generation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/Frontend-React_18-6366f1.svg)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS_3-06b6d4.svg)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Backend-Python_3-10b981.svg)](https://www.python.org/)
[![Database](https://img.shields.io/badge/Database-SQLite_3-8b5cf6.svg)](https://www.sqlite.org/)
[![UGC CBCS](https://img.shields.io/badge/Standards-UGC_CBCS_10--Point_Scale-f59e0b.svg)](https://www.ugc.gov.in/)
[![Accreditation](https://img.shields.io/badge/Accreditation-NAAC_Grade_A%2B%2B-e11d48.svg)](https://www.mmumullana.org/)

**CredGen** is an enterprise-grade university examination, marksheet generation, and credit evaluation platform compliant with the **UGC Choice Based Credit System (CBCS) 10-point scale**. Built for higher technical education institutions, CredGen integrates course question banking, high-speed bulk question ingestion (50–100+ questions), anti-malpractice proctoring forensic telemetry, cryptographic SHA-256 digital transcript seals, and automated SGPA/CGPA computation.

---

## System Architecture

```
                      +------------------------------------------+
                      |         CredGen Web Application          |
                      |   React 18 + Tailwind CSS + Lucide Icons |
                      +--------------------+---------------------+
                                           |
                    RESTful JSON HTTP APIs | (CORS Enabled)
                                           v
                      +------------------------------------------+
                      |       CredGen Python REST API Server     |
                      |          (server.py on Port 5000)        |
                      +--------------------+---------------------+
                                           |
                          Embedded Storage | SQLite Driver
                                           v
                      +------------------------------------------+
                      |      credgen.db (SQLite3 Database)       |
                      |  - users          - questions            |
                      |  - exams          - marksheets           |
                      |  - proctor_sessions                      |
                      +------------------------------------------+
```

---

## Core Modules & Capabilities

### 1. Marksheet Studio & Transcript Engine
- **5 Academic Presets**:
  - **Preset 1**: Official MMDU NAAC Grade A++ Institutional Transcript
  - **Preset 2**: Chancellor's Executive Gold Award
  - **Preset 3**: Modern MMEC Engineering & Tech Specification
  - **Preset 4**: Classical University Diploma Certificate
  - **Preset 5**: Direct Custom Uploaded Template (Strict **Zero-Alteration** Rule: uploaded template displays directly without artificial watermarks or frame alterations)
- **Live UGC CBCS Computation**: Auto-computes component totals (Internal 30 + Mid-term 20 + End-term 50 = 100), Letter Grades (`O`, `A+`, `A`, `B+`, `B`, `C`, `P`, `F`), Grade Points (0–10), and Course Credit Points.
- **Cryptographic Seals**: Automatically generates 64-character SHA-256 verification hashes and digital QR verification payloads upon publication.

### 2. Course Question Repository & High-Speed Bulk Studio
- **Curriculum Taxonomy**: Categorized by Course Codes (`CS-302: DBMS`, `CS-304: DAA`, `CS-306: Networks`, `CS-308: Software Engg`, `CS-310: AI/ML`), Bloom's Taxonomy, and assessment type (`MCQ`, `Subjective`).
- **Collapsible Bulk Ingestion Studio**: Live 2-column drawer parser capable of ingesting 50–100+ questions at once with 1-click sample loaders (25 MCQs, 10 Subjective, CSV/Pipe format).

### 3. Dynamic User Profile & Initial Letter Avatars
- **Zero AI-Generated Stock Photos**: All default artificial Unsplash stock photos replaced with high-contrast, clean name initial badges (**`VK`**, **`BS`**, **`VS`**, **`RV`**) styled with role-based gradients.
- **1-Click Photo Upload**: Interactive file upload trigger allowing administrators, faculty, and students to upload custom profile images or revert to name initials with 1 click.

### 4. Examination Manager & Assessment Creation Wizard
- **3-Step Wizard**:
  1. *Metadata*: Course selection, credit weights, batch assignments.
  2. *Timings & Rules*: Duration, passing criteria, negative marking penalties (`-0.5 Marks`).
  3. *Question Bank Selection*: 1-click question selection and repository filtering.

### 5. AI Proctoring & Forensic Audits
- Real-time candidate audio/video surveillance, decibel acoustic metering, unauthorized window switch tracking, incident timeline logging (`[INCIDENT]`, `[ALERT]`, `[VERIFIED]`), and automated malpractice session termination.

---

## Repository Structure

```
CredGen Project Source code/
├── .gitignore                   # Git ignore specification
├── LICENSE                      # MIT Open Source License
├── README.md                    # Project documentation & GitHub setup guide
├── requirements.txt             # Python backend runtime documentation
├── package.json                 # Node/React dependencies and scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Tailwind CSS theme & color tokens
├── vite.config.js               # Vite bundler configuration
│
├── index.html                   # Monolithic full-stack SPA client (Port 5173)
├── server.py                    # SQLite3 REST API backend server (Port 5000)
├── credgen.db                   # SQLite3 persistent relational database
├── image_assets.js              # Institutional branding & logo assets
├── mmdu_logo.png                # Official MMDU university seal
├── naac_logo.png                # NAAC Grade A++ accreditation seal
├── campus_gate.png              # MMDU campus background asset
├── building_watermark.png       # Transcript guilloche watermark
│
└── src/                         # Modular React components & architecture
    ├── App.jsx                  # Root React application
    ├── main.jsx                 # Client entrypoint
    ├── index.css                # Universal styles & custom scrollbars
    ├── components/
    │   ├── auth/                # 2FA Login & Registration modals
    │   ├── common/              # Navbar, Sidebar, UserAvatar components
    │   ├── dashboard/           # Admin, Faculty & Candidate workspaces
    │   └── modules/             # MarksheetStudio, QuestionBank, ExamCreator
    ├── context/
    │   └── AppContext.jsx       # Global application state management
    └── data/
        └── mockData.js          # Academic curriculum & seed data
```

---

## Backend REST API Endpoints

The backend server runs on `http://localhost:5000` with full CORS support:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check & SQLite connection status |
| `GET` | `/api/db/verify` | Database verification & table row count audit |
| `GET` | `/api/users` | List active or archived institutional users |
| `POST` | `/api/auth/send-real-otp` | Generate and dispatch 2FA Email & Phone OTPs |
| `POST` | `/api/auth/verify-otp` | Verify Two-Factor OTP codes |
| `POST` | `/api/auth/login` | Institutional credentials authentication |
| `POST` | `/api/users/:id/avatar` | Upload custom user profile photo |
| `GET` | `/api/questions` | Filter question repository by course, type, keyword |
| `POST` | `/api/questions` | Author and store single assessment question |
| `POST` | `/api/questions/bulk` | Bulk ingest 50–100+ parsed questions into SQLite |
| `DELETE` | `/api/questions/:id` | Remove question from repository |
| `GET` | `/api/exams` | List scheduled institutional examinations |
| `POST` | `/api/exams` | Create assessment from 3-step wizard |
| `GET` | `/api/marksheets` | Retrieve student transcript dossiers |
| `POST` | `/api/marksheets/:id/publish` | Publish marksheet with SHA-256 digital stamp |
| `GET` | `/api/proctoring/sessions` | Retrieve forensic proctoring audit feeds |

---

## Quickstart Guide

### 1. Prerequisites
- Python 3.8+ (Standard Library — zero mandatory external pip dependencies)
- Modern Web Browser (Google Chrome, Microsoft Edge, Firefox, Safari)

### 2. Running the Backend Server
```bash
python server.py
```
*The server will automatically initialize `credgen.db` with all tables, seed data, and start listening on `http://localhost:5000`.*

Verify backend health in browser or terminal:
```bash
curl http://localhost:5000/api/db/verify
```

### 3. Running the Frontend
Start a local web server in the project directory:
```bash
python -m http.server 5173
```
*Open **http://localhost:5173** in your web browser.*

---

## Instructions to Push to GitHub

To push this complete project repository to your GitHub account:

### Step 1: Initialize Git in the Project Directory
```bash
git init
```

### Step 2: Add All Project Files
```bash
git add .
```

### Step 3: Make Initial Commit
```bash
git commit -m "feat: Initial commit of CredGen Academic Platform with SQLite Backend, Marksheet Studio & 2FA"
```

### Step 4: Rename Default Branch to `main`
```bash
git branch -M main
```

### Step 5: Link Your Remote GitHub Repository
*(Replace `<your-username>` and `<your-repo-name>` with your GitHub username and repository name)*
```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
```

### Step 6: Push Source Code to GitHub
```bash
git push -u origin main
```

---

## UGC CBCS 10-Point Conversion Matrix

| Letter Grade | Performance Descriptor | Score Range (%) | Grade Point (G) |
|---|---|---|---|
| **O** | Outstanding | 90% – 100% | **10** |
| **A+** | Excellent | 80% – 89.99% | **9** |
| **A** | Very Good | 70% – 79.99% | **8** |
| **B+** | Good | 60% – 69.99% | **7** |
| **B** | Above Average | 50% – 59.99% | **6** |
| **C** | Average | 45% – 49.99% | **5** |
| **P** | Pass | 40% – 44.99% | **4** |
| **F** | Fail | 0% – 39.99% | **0** |

$$\text{Semester SGPA} = \frac{\sum_{i=1}^{n} (C_i \times G_i)}{\sum_{i=1}^{n} C_i}$$

---

## Institutional Leadership & Credits

- **Project Lead & Chief Administrator**: **Vivek Kumar** (Roll No: 11242634)
- **Chief System Architect & Exam Controller**: **Banda Shashank** (Roll No: 11242656)
- **Faculty Guide**: **Dr. Vinsha Sumra** (Professor, Computer Science & Engineering)
- **Institution**: **Maharishi Markandeshwar (Deemed to be University), Mullana, Ambala, Haryana, India (NAAC Grade A++)**

---

## License
This project is open source and available under the [MIT License](LICENSE).
