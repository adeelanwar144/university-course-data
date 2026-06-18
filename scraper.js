/**
 * University Course Scraper v2 — Puppeteer for ALL universities
 * Fixes the 0-courses problem by using real browser rendering
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'data');
const DELAY = 3000;

// ── Session dates ──────────────────────────────────────────────────────────
const SESSIONS = {
  ucla_a:    { start: 'June 22, 2026',  end: 'July 31, 2026'    },
  ucla_c:    { start: 'June 22, 2026',  end: 'August 28, 2026'  },
  harvard7w: { start: 'June 22, 2026',  end: 'August 7, 2026'   },
  harvard4w: { start: 'July 13, 2026',  end: 'August 6, 2026'   },
  mit:       { start: 'June 9, 2026',   end: 'August 19, 2026'  },
  nyu1:      { start: 'May 18, 2026',   end: 'June 30, 2026'    },
  nyu2:      { start: 'July 1, 2026',   end: 'August 12, 2026'  },
  stanford:  { start: 'June 23, 2026',  end: 'August 14, 2026'  },
  utaustin:  { start: 'June 9, 2026',   end: 'August 14, 2026'  },
};

// ── University configs ─────────────────────────────────────────────────────
const UNIVERSITIES = [
  {
    id: 'ucla', name: 'UCLA',
    fullName: 'University of California, Los Angeles',
    location: 'Los Angeles, CA',
    sessions: [SESSIONS.ucla_a, SESSIONS.ucla_c],
    departments: [
      { name: 'Computer Science',       code: 'COM SCI' },
      { name: 'Mathematics',            code: 'MATH'    },
      { name: 'Economics',              code: 'ECON'    },
      { name: 'Physics',                code: 'PHYSICS' },
      { name: 'Chemistry',              code: 'CHEM'    },
      { name: 'Biology',                code: 'BIOL'    },
      { name: 'English',                code: 'ENGL'    },
      { name: 'History',                code: 'HIST'    },
      { name: 'Psychology',             code: 'PSYCH'   },
      { name: 'Political Science',      code: 'POL SCI' },
      { name: 'Statistics',             code: 'STATS'   },
      { name: 'Electrical Engineering', code: 'EC ENGR' },
      { name: 'Life Sciences',          code: 'LIFESCI' },
      { name: 'Film and Television',    code: 'FILM TV' },
    ],
    getUrl: (code) => `https://sa.ucla.edu/ro/public/soc/Results?SubjectAreaName=&t=261&s_g_cd=%25&sBy=subject&subj=${encodeURIComponent(code)}&catlg=&cls_no=&undefined=Go&btnIsInIndex=btn_inIndex`,
    waitFor: 'body',
    extract: async (page) => {
      return await page.evaluate(() => {
        const courses = [];
        // UCLA injects into data-ucla-sa="replace" div after JS runs
        const rows = document.querySelectorAll('tr.class-info, .class-row, [class*="class"]');
        // Also try table rows
        document.querySelectorAll('table tr').forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 6) {
            const title = row.querySelector('.course-title, a[href*="course"]')?.textContent?.trim()
                       || cells[1]?.textContent?.trim();
            const code  = cells[0]?.textContent?.trim();
            if (title && title.length > 3 && code && code.length > 3) {
              courses.push({
                courseCode:   code,
                courseTitle:  title,
                credits:      cells[2]?.textContent?.trim() || '',
                instructor:   cells[3]?.textContent?.trim() || '',
                meetingDays:  cells[4]?.textContent?.trim() || '',
                meetingTime:  cells[5]?.textContent?.trim() || '',
                location:     cells[6]?.textContent?.trim() || '',
                seatsAvailable: cells[7]?.textContent?.trim() || '',
              });
            }
          }
        });

        // Also check for course heading + section pattern
        document.querySelectorAll('.primarySection, .class-info').forEach(el => {
          const title = el.querySelector('.crs-title, .course-name')?.textContent?.trim();
          const code  = el.querySelector('.crs-no, .course-num')?.textContent?.trim();
          if (title) courses.push({ courseCode: code || '', courseTitle: title });
        });

        return courses;
      });
    }
  },

  {
    id: 'harvard', name: 'Harvard',
    fullName: 'Harvard University',
    location: 'Cambridge, MA',
    sessions: [SESSIONS.harvard7w, SESSIONS.harvard4w],
    departments: [
      { name: 'Computer Science', code: 'computer-science'  },
      { name: 'Mathematics',      code: 'mathematics'       },
      { name: 'Economics',        code: 'economics'         },
      { name: 'Physics',          code: 'physics'           },
      { name: 'Biology',          code: 'life-sciences'     },
      { name: 'Chemistry',        code: 'chemistry'         },
      { name: 'English',          code: 'english'           },
      { name: 'History',          code: 'history'           },
      { name: 'Psychology',       code: 'psychology'        },
      { name: 'Government',       code: 'government'        },
      { name: 'Philosophy',       code: 'philosophy'        },
      { name: 'Statistics',       code: 'statistics'        },
    ],
    getUrl: (code) => `https://summer.harvard.edu/course-catalog/courses/?categories=${code}&session=all`,
    waitFor: '.course-listing, .panel-title, h2, article',
    extract: async (page) => {
      return await page.evaluate(() => {
        const courses = [];
        // Harvard Summer School course cards
        const selectors = [
          '.course-listing', '.panel-default', 'article.course',
          '.course-card', '[class*="course"]'
        ];
        selectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => {
            const title = el.querySelector('h2, h3, h4, .course-title, .panel-title')?.textContent?.trim();
            const code  = el.querySelector('.course-number, .catalog-number, [class*="number"]')?.textContent?.trim();
            const inst  = el.querySelector('.instructor, [class*="instructor"], [class*="faculty"]')?.textContent?.trim();
            const creds = el.querySelector('.credits, .units, [class*="credit"]')?.textContent?.trim();
            const desc  = el.querySelector('p, .description, [class*="desc"]')?.textContent?.trim();
            if (title && title.length > 4) {
              courses.push({ courseCode: code||'', courseTitle: title, instructor: inst||'', credits: creds||'', description: desc||'' });
            }
          });
        });
        return [...new Map(courses.map(c => [c.courseTitle, c])).values()]; // dedupe
      });
    }
  },

  {
    id: 'mit', name: 'MIT',
    fullName: 'Massachusetts Institute of Technology',
    location: 'Cambridge, MA',
    sessions: [SESSIONS.mit],
    departments: [
      { name: 'Computer Science & Engineering', code: '6'   },
      { name: 'Mathematics',                    code: '18'  },
      { name: 'Physics',                        code: '8'   },
      { name: 'Chemistry',                      code: '5'   },
      { name: 'Biology',                        code: '7'   },
      { name: 'Economics',                      code: '14'  },
      { name: 'Political Science',              code: '17'  },
      { name: 'Brain & Cognitive Sciences',     code: '9'   },
      { name: 'Mechanical Engineering',         code: '2'   },
      { name: 'Electrical Engineering',         code: '6.1' },
    ],
    getUrl: (code) => `https://student.mit.edu/catalog/search.cgi?Search=1&style=3&when=S&term=2026&dept=${code}`,
    waitFor: 'body',
    extract: async (page) => {
      return await page.evaluate(() => {
        const courses = [];
        // MIT catalog uses traditional HTML tables
        document.querySelectorAll('tr').forEach(row => {
          const link = row.querySelector('a[href*="catalog"]');
          const code = link?.textContent?.trim();
          const title = row.querySelector('td:nth-child(2) a, td:nth-child(2)')?.textContent?.trim();
          const units = row.querySelector('td:nth-child(3)')?.textContent?.trim();
          const instr = row.querySelector('td:nth-child(4)')?.textContent?.trim();
          if (code && title && code.match(/\d/)) {
            courses.push({ courseCode: code, courseTitle: title, credits: units||'', instructor: instr||'' });
          }
        });

        // Also try subject headings
        document.querySelectorAll('h3, .subject-title').forEach(h => {
          const text = h.textContent?.trim();
          if (text && text.match(/^\d/)) {
            const parts = text.split(' ');
            courses.push({ courseCode: parts[0], courseTitle: parts.slice(1).join(' ') });
          }
        });

        return [...new Map(courses.map(c => [c.courseCode, c])).values()];
      });
    }
  },

  {
    id: 'nyu', name: 'NYU',
    fullName: 'New York University',
    location: 'New York, NY',
    sessions: [SESSIONS.nyu1, SESSIONS.nyu2],
    departments: [
      { name: 'English',          code: 'ENGL'  },
      { name: 'Mathematics',      code: 'MATH'  },
      { name: 'Computer Science', code: 'CSCI'  },
      { name: 'Economics',        code: 'ECON'  },
      { name: 'Physics',          code: 'PHYS'  },
      { name: 'Chemistry',        code: 'CHEM'  },
      { name: 'Biology',          code: 'BIOL'  },
      { name: 'Psychology',       code: 'PSYCH' },
      { name: 'History',          code: 'HIST'  },
      { name: 'Politics',         code: 'POL'   },
    ],
    getUrl: (code) => `https://bulletins.nyu.edu/class-search/?term=summer2026&subject=${code}`,
    waitFor: 'body',
    extract: async (page) => {
      return await page.evaluate(() => {
        const courses = [];
        // NYU Bulletin class search
        const allText = document.body.innerText;

        document.querySelectorAll('[class*="section"], [class*="course"], [class*="class"], tr, li').forEach(el => {
          const title = el.querySelector('h2,h3,h4,[class*="title"]')?.textContent?.trim();
          const code  = el.querySelector('[class*="number"],[class*="code"],[class*="catalog"]')?.textContent?.trim();
          const instr = el.querySelector('[class*="instructor"],[class*="faculty"]')?.textContent?.trim();
          const creds = el.querySelector('[class*="credit"],[class*="unit"]')?.textContent?.trim();
          if (title && title.length > 4 && !title.includes('NYU') && !title.includes('Search')) {
            courses.push({ courseCode: code||'', courseTitle: title, instructor: instr||'', credits: creds||'' });
          }
        });
        return [...new Map(courses.map(c => [c.courseTitle, c])).values()].slice(0, 50);
      });
    }
  },

  {
    id: 'ut-austin', name: 'UT Austin',
    fullName: 'University of Texas at Austin',
    location: 'Austin, TX',
    sessions: [SESSIONS.utaustin],
    departments: [
      { name: 'Computer Science', code: 'C S'  },
      { name: 'Mathematics',      code: 'M'    },
      { name: 'Economics',        code: 'ECO'  },
      { name: 'Physics',          code: 'PHY'  },
      { name: 'Chemistry',        code: 'CH'   },
      { name: 'Biology',          code: 'BIO'  },
      { name: 'English',          code: 'E'    },
      { name: 'History',          code: 'HIS'  },
      { name: 'Psychology',       code: 'PSY'  },
      { name: 'Government',       code: 'GOV'  },
    ],
    getUrl: (code) => `https://utdirect.utexas.edu/apps/registrar/course_schedule/20266/${encodeURIComponent(code)}/`,
    waitFor: 'body',
    extract: async (page) => {
      return await page.evaluate(() => {
        const courses = [];
        document.querySelectorAll('table tr, .course-list li').forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const code  = cells[0]?.textContent?.trim();
            const title = cells[1]?.textContent?.trim();
            const instr = cells.length > 4 ? cells[4]?.textContent?.trim() : '';
            const units = cells[2]?.textContent?.trim();
            if (code && title && title.length > 3 && !title.toLowerCase().includes('title')) {
              courses.push({ courseCode: code, courseTitle: title, instructor: instr, credits: units });
            }
          }
        });
        return courses;
      });
    }
  },
];

// ── Assignment templates by department ─────────────────────────────────────
function getAssignments(deptName, sessionStart) {
  const start = new Date(sessionStart || 'June 22, 2026');
  const types = {
    'Computer Science': [
      { type:'Problem Set', name:'Problem Set 1 — Fundamentals',    weight:10 },
      { type:'Problem Set', name:'Problem Set 2 — Data Structures', weight:10 },
      { type:'Project',     name:'Project 1 — Mini Application',    weight:15 },
      { type:'Problem Set', name:'Problem Set 3 — Algorithms',      weight:10 },
      { type:'Quiz',        name:'Weekly Quizzes (x5)',              weight:10 },
      { type:'Midterm',     name:'Midterm Exam',                     weight:20 },
      { type:'Project',     name:'Final Project',                    weight:15 },
      { type:'Final Exam',  name:'Final Exam',                       weight:10 },
    ],
    'Mathematics': [
      { type:'Homework',   name:'Weekly Homework (x8)',  weight:20 },
      { type:'Quiz',       name:'Weekly Quizzes (x6)',   weight:15 },
      { type:'Midterm',    name:'Midterm Exam 1',        weight:20 },
      { type:'Midterm',    name:'Midterm Exam 2',        weight:20 },
      { type:'Final Exam', name:'Final Exam',            weight:25 },
    ],
    'default': [
      { type:'Assignment', name:'Assignment 1', weight:15 },
      { type:'Assignment', name:'Assignment 2', weight:15 },
      { type:'Midterm',    name:'Midterm Exam', weight:25 },
      { type:'Assignment', name:'Project',      weight:15 },
      { type:'Final Exam', name:'Final Exam',   weight:30 },
    ],
  };

  const key = Object.keys(types).find(k => deptName.toLowerCase().includes(k.toLowerCase())) || 'default';
  return types[key].map((a, i) => {
    const due = new Date(start);
    due.setDate(due.getDate() + (i + 1) * 10);
    return { ...a, dueDate: due.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) };
  });
}

function getAssessments(deptName) {
  const dept = deptName.toLowerCase();
  if (dept.includes('computer')) return [
    { name:'Problem Sets', percentage:30 }, { name:'Quizzes', percentage:10 },
    { name:'Midterm Exam', percentage:20 }, { name:'Projects', percentage:15 },
    { name:'Final Exam',   percentage:25 },
  ];
  if (dept.includes('math')) return [
    { name:'Homework',      percentage:20 }, { name:'Quizzes',    percentage:15 },
    { name:'Midterm 1',     percentage:20 }, { name:'Midterm 2',  percentage:20 },
    { name:'Final Exam',    percentage:25 },
  ];
  return [
    { name:'Assignments',   percentage:30 }, { name:'Participation', percentage:10 },
    { name:'Midterm Exam',  percentage:25 }, { name:'Final Exam',    percentage:35 },
  ];
}

function getModules(deptName, sessionStart) {
  const start = new Date(sessionStart || 'June 22, 2026');
  const dept  = deptName.toLowerCase();
  const topics = dept.includes('computer') ? [
    'Introduction & Setup', 'Variables & Control Flow', 'Functions & Scope',
    'Arrays & Data Structures', 'Algorithms & Complexity', 'OOP Concepts',
    'Files & Debugging', 'Final Review'
  ] : dept.includes('math') ? [
    'Limits & Continuity', 'Derivatives', 'Applications of Derivatives',
    'Integrals', 'Techniques of Integration', 'Series & Sequences',
    'Multivariable Intro', 'Final Review'
  ] : dept.includes('econ') ? [
    'Supply & Demand', 'Consumer Theory', 'Producer Theory',
    'Market Structures', 'Game Theory', 'Market Failures',
    'Macro Overview', 'Policy Analysis'
  ] : [
    'Introduction & Foundations', 'Core Theory I', 'Core Theory II',
    'Applied Methods', 'Case Studies', 'Research Skills',
    'Advanced Topics', 'Final Presentations'
  ];

  return topics.map((topic, i) => {
    const ws = new Date(start); ws.setDate(ws.getDate() + i * 7);
    const we = new Date(ws);    we.setDate(we.getDate() + 4);
    return {
      week:      `Week ${i + 1}`,
      dateRange: `${ws.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${we.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`,
      topic,
    };
  });
}

function enrichCourse(raw, deptName, uni, session) {
  const assignments = getAssignments(deptName, session?.start);
  const assessments = getAssessments(deptName);
  const modules     = getModules(deptName, session?.start);

  return {
    // Identity
    university:      uni.fullName,
    universitySlug:  uni.id,
    universityCity:  uni.location,
    department:      deptName,
    courseCode:      raw.courseCode   || '',
    courseTitle:     raw.courseTitle  || '',
    section:         raw.section      || '',

    // Schedule
    term:             'Summer 2026',
    sessionStart:     session?.start  || '',
    sessionEnd:       session?.end    || '',
    instructionStart: session?.start  || '',
    instructionEnd:   session?.end    || '',
    meetingDays:      raw.meetingDays || '',
    meetingTime:      raw.meetingTime || '',
    location:         raw.location    || '',
    format:           raw.format      || 'In Person',

    // Course info
    credits:     raw.credits     || '3',
    instructor:  raw.instructor  || 'TBD',
    description: raw.description || `${raw.courseTitle} at ${uni.fullName}, Summer 2026.`,
    prerequisites:   'See course syllabus',
    syllabusUrl:     '',
    seatsAvailable:  raw.seatsAvailable || 'See registrar',
    enrollmentStatus:'Open',

    // Detailed academic data
    assignments,
    assessments,
    weeklyModules: modules,
    totalAssignments: assignments.length,
    gradingPolicy: `${uni.fullName} uses standard letter grading (A–F).`,

    // SEO
    seoTitle:       `${raw.courseCode} ${raw.courseTitle} — ${uni.name} Summer 2026 Assignment Help`,
    seoDescription: `Expert assignment help for ${raw.courseTitle} (${raw.courseCode}) at ${uni.fullName}. Summer 2026: ${session?.start} – ${session?.end}.`,
    seoKeywords: [
      `${raw.courseCode} assignment help`,
      `${raw.courseTitle} homework help`,
      `${uni.name} ${deptName} assignment help`,
      `${uni.name} summer 2026`,
      `${raw.courseCode} ${uni.name}`,
      `${uni.name} assignment writing service`,
    ],

    scrapedAt:  new Date().toISOString(),
    dataSource: 'Live Puppeteer scrape',
  };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function run() {
  console.log('🚀 University Scraper v2 — Puppeteer Mode');
  console.log(`📅 Summer 2026 | June – September`);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });

  const index = {
    scrapedAt:           new Date().toISOString(),
    term:                'Summer 2026',
    dateRange:           'June – September 2026',
    universitiesTotal:   UNIVERSITIES.length,
    universitiesSuccess: 0,
    totalCourses:        0,
    universities:        [],
  };

  for (const uni of UNIVERSITIES) {
    console.log(`\n🏫 ${uni.fullName}`);
    const uniData = {
      id: uni.id, name: uni.name, fullName: uni.fullName,
      location: uni.location, term: 'Summer 2026',
      sessions: uni.sessions, scrapedAt: new Date().toISOString(),
      departments: [], totalCourses: 0, errors: [],
    };

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    for (const dept of uni.departments) {
      console.log(`  📚 ${dept.name}...`);
      try {
        const url = uni.getUrl(dept.code);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for content + extra JS render time
        try { await page.waitForSelector(uni.waitFor, { timeout: 8000 }); } catch(e) {}
        await new Promise(r => setTimeout(r, DELAY));

        const raw = await uni.extract(page);
        const session = uni.sessions[0];
        const enriched = raw
          .filter(c => c.courseTitle && c.courseTitle.length > 3)
          .map(c => enrichCourse(c, dept.name, uni, session));

        uniData.departments.push({
          name: dept.name, code: dept.code,
          courseUrl: url, courses: enriched, count: enriched.length,
        });
        uniData.totalCourses += enriched.length;

        // Save per-department file
        const dir = path.join(OUTPUT_DIR, uni.id);
        fs.mkdirSync(dir, { recursive: true });
        const slug = dept.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify({ department: dept.name, courses: enriched }, null, 2));

        console.log(`    ✅ ${enriched.length} courses`);
        await new Promise(r => setTimeout(r, 1500));

      } catch(err) {
        console.error(`    ❌ ${dept.name}: ${err.message}`);
        uniData.errors.push({ dept: dept.name, error: err.message });
      }
    }

    await page.close();

    // Save university file
    const dir = path.join(OUTPUT_DIR, uni.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'summer2026.json'), JSON.stringify(uniData, null, 2));

    index.universitiesSuccess++;
    index.totalCourses += uniData.totalCourses;
    index.universities.push({
      id: uni.id, name: uni.fullName,
      totalCourses: uniData.totalCourses,
      departments: uniData.departments.length,
      status: uniData.errors.length === 0 ? 'success' : 'partial',
    });

    console.log(`  ✅ ${uni.name}: ${uniData.totalCourses} courses saved`);
  }

  await browser.close();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.json'), JSON.stringify(index, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Done!');
  console.log(`Universities: ${index.universitiesSuccess}/${index.universitiesTotal}`);
  console.log(`Total Courses: ${index.totalCourses}`);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
