/**
 * Starter content.
 *
 * Runs once, only when the store is completely empty. Everything here is
 * editable from the admin panel afterwards - this exists so a fresh deploy
 * shows a finished site instead of an empty shell.
 */

const SITE = {
  name: "Ahsaan Munir",
  role: "Full Stack & AI/ML Engineer",
  availability: "Open to work — Lahore / Remote",
  heroLine:
    "I build products end to end — React fronts, Python and Node backends, and the models in between. Ten of them are running right now.",
  aboutTitle: "Proof over promises.",
  about: [
    "I'm a software engineer from Lahore who likes the whole distance — architecture to deployment. Most portfolios show screenshots; mine opens ten running products, because a link you can click says more than a paragraph ever will.",
    "The work I care about most sits where AI meets people the tools were never built for: a voice receptionist that handles real phone calls, a sign-language translator for the deaf community, a symptom guide that understands how people actually type. Models are easy to demo and hard to ship — the shipping is the job.",
    "Currently interning at Infotech under the CMIT Program 2026 on the MERN stack, freelancing for a German client, and always building something on the side.",
  ],
  stats: [
    { value: 10, suffix: "", label: "live deployments" },
    { value: 85, suffix: "%+", label: "sign-language accuracy" },
    { value: 92, suffix: "%", label: "fraud-detection accuracy" },
    { value: 40, suffix: "%", label: "API performance gain" },
  ],
  email: "ahsaanmunir141@gmail.com",
  phone: "+92 314 6392517",
  location: "Lahore, Pakistan",
  linkedin: "https://www.linkedin.com/in/ahsaan-munir-3a288a321",
  github: "https://github.com/ahsaanmunir53",
  cvFile: "Ahsaan-Munir-CV.pdf",
  contactTitle: "Let's build something that ships.",
  contactLine:
    "Roles, internships, freelance, or a wild idea that needs a working prototype by Friday — my inbox is open.",
  footer: "© 2026 Ahsaan Munir — designed and built by hand, deployed like everything else here.",
  marquee: [
    "React", "Node.js", "Python", "Django", "FastAPI", "TensorFlow",
    "MongoDB", "Docker", "Voice AI", "RAG", "Computer Vision", "MERN",
  ],
};

const PROJECTS = [
  {
    title: "DocMind",
    tagline: "Document Intelligence & ATS CV Studio",
    description:
      "Upload heavy PDFs and interrogate them: hybrid BM25 and vector retrieval with page-cited answers, figure and signature detection, plus an ATS CV studio that interviews you to close gaps and then verifies nothing was invented.",
    url: "https://docqa-3nqw.onrender.com",
    initials: "DM",
    hue: 258,
    tags: ["Django", "RAG", "PyMuPDF", "Groq"],
    status: "live",
    featured: true,
  },
  {
    title: "Monal AI",
    tagline: "Voice Receptionist That Answers The Phone",
    description:
      "A phone agent that takes real calls, books reservations, and confirms them over WhatsApp automatically. Full speech-to-text, LLM and text-to-speech pipeline behind a live React dashboard.",
    url: "https://monal-ai.onrender.com",
    initials: "MO",
    hue: 190,
    tags: ["STT / TTS", "LLM", "React", "WhatsApp API"],
    status: "live",
    featured: true,
  },
  {
    title: "Sign Bridge",
    tagline: "Sign Language Translator",
    description:
      "Recognises sign language at over 85% accuracy using a CNN, BiLSTM and Attention model, served through a Flask ML API behind a React front end.",
    url: "https://sign-web-v7cj.onrender.com",
    initials: "SB",
    hue: 140,
    tags: ["TensorFlow", "Flask", "React"],
    status: "live",
  },
  {
    title: "SEHAT",
    tagline: "Symptom Guidance, Not Diagnosis",
    description:
      "A doctor-style consultation flow with deterministic emergency screening that runs before every message, pregnancy-aware triage, and twenty step-by-step first-aid protocols for the wait before help arrives.",
    url: "https://sehat-g2f6.onrender.com",
    initials: "SE",
    hue: 162,
    tags: ["FastAPI", "Groq", "Safety layer"],
    status: "live",
  },
  {
    title: "JobMatch AI",
    tagline: "Score Your Fit Before You Apply",
    description:
      "Puts a candidate profile against real job descriptions with AI — scoring the fit, surfacing missing skills, and ranking where to apply first.",
    url: "https://jobmatch-ai-lee4.onrender.com",
    initials: "JM",
    hue: 288,
    tags: ["AI matching", "Full-stack"],
    status: "live",
  },
  {
    title: "Reel",
    tagline: "Film Index On Live TMDB Data",
    description:
      "Browse, search and track films with debounced search, favourites and recently-viewed through the Context API, and skeleton loading everywhere it matters.",
    url: "https://reel-movie-app.onrender.com",
    initials: "RE",
    hue: 212,
    tags: ["React Router", "Context API", "TMDB"],
    status: "live",
  },
  {
    title: "MAHRU",
    tagline: "Commerce With Recommendations",
    description:
      "A full MERN commerce build: ML-driven product recommendations, Stripe checkout, role-based admin, and order management end to end.",
    url: "https://mahru-store.onrender.com",
    initials: "MA",
    hue: 348,
    tags: ["MongoDB", "Express", "React", "Stripe"],
    status: "live",
  },
  {
    title: "LUMÉRA",
    tagline: "Salon Identity, Built To Book",
    description:
      "A premium salon's digital identity — services, pricing and booking, art-directed end to end.",
    url: "https://lumera-salon.onrender.com",
    initials: "LU",
    hue: 326,
    tags: ["Frontend", "Brand design"],
    status: "live",
  },
  {
    title: "QAHVA",
    tagline: "A Café's Digital Front Door",
    description:
      "Menu, story and ordering wrapped in a warm editorial identity that carries the room onto the screen.",
    url: "https://qahva-cafe.onrender.com",
    initials: "QA",
    hue: 28,
    tags: ["Frontend", "Brand design"],
    status: "live",
  },
  {
    title: "Fatima Hope",
    tagline: "Psychological Centre — Client Work",
    description:
      "Production website for a psychological care organisation: React and TypeScript front end with a Node and Express admin dashboard. Real client, real users, on its own domain.",
    url: "https://www.fatima-hope.org/",
    initials: "FH",
    hue: 100,
    tags: ["React", "TypeScript", "Node / Express"],
    status: "live",
  },
];

const EXPERIENCE = [
  {
    role: "MERN Stack Developer Intern",
    org: "Infotech · CMIT Program 2026 · Lahore",
    period: "2026 — Present",
    current: true,
    points: [
      "Building full-stack features across MongoDB, Express.js, React and Node.js on company projects.",
      "Working with Infotech's development team on Git-based workflows and feature delivery.",
    ],
  },
  {
    role: "Software Engineer & AI/ML Developer — Freelance",
    org: "Self-employed · German client · Remote",
    period: "Nov 2025 — Present",
    current: true,
    points: [
      "Developing a live production project across Python backend, ML model training and React features.",
      "Shipping under real business deadlines while gathering requirements from non-technical stakeholders.",
      "Context-switching between full-stack and AI/ML work as the project evolves.",
    ],
  },
  {
    role: "Web Development Intern",
    org: "InternNCraft · On-site",
    period: "Dec 2024 — Jan 2025",
    current: false,
    points: [
      "Built full-stack e-commerce and e-learning platforms on the MERN stack.",
      "Delivered secure admin dashboards with auth, role management and payment gateways.",
      "Designed and optimised REST APIs, improving application performance by 40%.",
    ],
  },
];

const SKILLS = [
  { group: "Languages", items: ["Python", "JavaScript", "C++"] },
  { group: "Frontend", items: ["React.js", "HTML5", "CSS3"] },
  { group: "Backend", items: ["Node.js", "Express.js", "Django", "Flask", "FastAPI"] },
  { group: "Databases", items: ["MongoDB", "MySQL", "SQL Server"] },
  {
    group: "AI / ML",
    items: ["TensorFlow", "Scikit-learn", "OpenCV", "CNN · LSTM · BiLSTM", "Attention", "Computer Vision", "NLP", "RAG"],
  },
  { group: "Tools & Methods", items: ["Docker", "Git · GitHub", "REST APIs", "Cloud", "Agile · Scrum"] },
];

async function run(store) {
  await store.saveSite(SITE);
  for (const p of PROJECTS) await store.create("projects", p);
  for (const e of EXPERIENCE) await store.create("experience", e);
  for (const s of SKILLS) await store.create("skills", s);
  console.log(
    "[seed] " + PROJECTS.length + " projects, " + EXPERIENCE.length +
    " roles, " + SKILLS.length + " skill groups"
  );
}

module.exports = { run, SITE, PROJECTS, EXPERIENCE, SKILLS };
