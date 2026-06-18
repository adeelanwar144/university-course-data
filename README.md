# 🎓 University Summer 2026 Course Scraper

Scrapes **live, real course data** from top US universities for Summer 2026 (June–September).

## What Data Is Collected Per Course

Every single course page gets all of these fields:

| Field | Example |
|---|---|
| University | University of California, Los Angeles |
| Department | Computer Science |
| Course Code | COM SCI 31 |
| Course Title | Introduction to Computer Science I |
| Instructor | Smallberg, D.A. |
| Credits | 5 units |
| Meeting Days | MTWTh |
| Meeting Time | 9:00am – 12:10pm |
| Location | Boelter Hall 3400 |
| Format | In Person / Online / Hybrid |
| Session Start | June 22, 2026 |
| Session End | July 31, 2026 |
| Instruction Start | June 22, 2026 |
| Instruction End | July 31, 2026 |
| Seats Available | 12 of 40 |
| Enrollment Status | Open |
| Prerequisites | None |
| Textbook | zyBook via UCLA Store |
| Syllabus URL | https://web.cs.ucla.edu/... |
| Assignments (x8) | Problem Sets, Projects, Exams |
| Due Dates | July 2, July 12, July 22... |
| Assignment Weights | 10%, 15%, 20%... |
| Assessments/Grading | Homework 30%, Midterm 20%... |
| Weekly Modules (x8) | Week 1: Variables & Control Flow... |
| SEO Title | COM SCI 31 — UCLA Summer 2026 Assignment Help |
| SEO Description | 160-char optimized description |
| SEO Keywords | 10 targeted keyword phrases |

## Universities Covered

| University | Departments | Type |
|---|---|---|
| UCLA | 18 departments | Plain HTML (fast) |
| Harvard | 15 departments | Plain HTML (fast) |
| MIT | 15 departments | Plain HTML (fast) |
| NYU | 12 departments | Plain HTML (fast) |
| Stanford | 12 departments | JS-rendered (Puppeteer) |
| UT Austin | 10 departments | Plain HTML (fast) |

## Setup — Zero Cost

### Step 1: Fork this repository on GitHub

```
https://github.com/YOUR-USERNAME/university-course-scraper
```

### Step 2: Enable GitHub Actions
Go to your repo → Actions tab → Enable workflows

### Step 3: Scraper runs automatically
Every day at 3:00 AM UTC, GitHub Actions:
1. Starts a free Ubuntu machine (full internet access)
2. Installs Node.js + Puppeteer (downloads Chromium)
3. Scrapes all university course pages
4. Saves JSON files to `/data/` folder
5. Commits and pushes the data
6. Machine shuts down — you pay nothing

### Step 4: Your website reads the data
```javascript
// In your Next.js / React website
const courses = await fetch(
  'https://raw.githubusercontent.com/YOUR-USERNAME/university-course-scraper/main/data/ucla/summer2026.json'
).then(r => r.json());
```

## File Structure After Scraping

```
data/
├── index.json                    ← Master index of all universities
├── ucla/
│   ├── summer2026.json           ← All UCLA courses
│   ├── computer-science.json     ← Just CS courses (faster page loads)
│   ├── mathematics.json
│   └── economics.json
├── harvard/
│   ├── summer2026.json
│   ├── computer-science.json
│   └── ...
├── mit/
│   └── ...
├── nyu/
│   └── ...
├── stanford/
│   └── ...
└── ut-austin/
    └── ...
```

## URL Pattern for Your Website

```
ucla.yoursite.com                           → UCLA homepage
ucla.yoursite.com/computer-science          → CS department
ucla.yoursite.com/computer-science/com-sci-31  → Course page

Reads from:
raw.githubusercontent.com/YOU/repo/main/data/ucla/computer-science.json
```

## GitHub Actions — Free Limits

- **2,000 minutes/month** free on GitHub Free plan
- Each daily scrape takes ~25–40 minutes
- Monthly usage: ~40 min × 30 days = **~1,200 minutes** ✅ Within free limit
- Chromium download: cached after first run — much faster subsequent runs

## Adding More Universities

In `scraper.js`, add a new entry to the `UNIVERSITIES` array:

```javascript
{
  id:       'columbia',
  name:     'Columbia',
  fullName: 'Columbia University',
  location: 'New York, NY',
  website:  'https://www.columbia.edu',
  type:     'html_public',
  sessions: [{ start: 'May 26, 2026', end: 'August 7, 2026' }],
  departments: [
    { name:'Computer Science', code:'COMS' },
    { name:'Economics',        code:'ECON' },
    // ...
  ],
  courseUrl: (code) => `https://vergil.columbia.edu/course-search?term=20262&dept=${code}`,
  parse: ($) => { /* selectors */ },
}
```

## Data Sources (All Public, No Login Required)

| University | Source URL | Term Code |
|---|---|---|
| UCLA | sa.ucla.edu/ro/public/soc | t=261 |
| Harvard | summer.harvard.edu/course-catalog | session=all |
| MIT | student.mit.edu/catalog/search.cgi | term=2026 |
| NYU | bulletins.nyu.edu/class-search | term=summer2026 |
| Stanford | explorecourses.stanford.edu | filter-term-Summer=on |
| UT Austin | utdirect.utexas.edu/registrar/course_schedule | 20266 |

## Legal

- Only scrapes publicly available pages (no login required)
- Respects 2-second delay between requests
- Stores data for display on assignment help service website
- Does not scrape student personal data
- Complies with robots.txt where applicable
