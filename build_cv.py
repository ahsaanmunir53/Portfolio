"""ATS-safe CV for Ahsaan Munir: single column, embedded selectable text,
no images, no tables. Measured word-wrap so nothing is silently dropped."""
import fitz

W, H = 595, 842
M = 50
INK = (0.10, 0.10, 0.12)
MUT = (0.38, 0.40, 0.46)
RULE = (0.72, 0.74, 0.78)

doc = fitz.open()
page = doc.new_page(width=W, height=H)
y = M

def need(h):
    global page, y
    if y + h > H - M:
        page = doc.new_page(width=W, height=H)
        y = M

def wrap_lines(text, width, size, font):
    lines = []
    for para in str(text).split("\n"):
        words = para.split()
        if not words:
            lines.append("")
            continue
        cur = ""
        for w in words:
            t = (cur + " " + w).strip()
            if fitz.get_text_length(t, fontname=font, fontsize=size) <= width:
                cur = t
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
    return lines

def write(text, size=9.6, font="helv", colour=INK, indent=0, gap=2.2, lh=1.32):
    global y
    width = W - 2 * M - indent
    lines = wrap_lines(text, width, size, font)
    for ln in lines:
        need(size * lh)
        page.insert_text(fitz.Point(M + indent, y + size), ln,
                         fontsize=size, fontname=font, color=colour)
        y += size * lh
    y += gap

def heading(text):
    global y
    y += 7
    need(20)
    write(text.upper(), size=10.2, font="hebo", colour=INK, gap=1.5)
    need(8)
    page.draw_line(fitz.Point(M, y), fitz.Point(W - M, y), color=RULE, width=0.7)
    y += 6

def bullet(text, size=9.6):
    global y
    width = W - 2 * M - 14
    lines = wrap_lines(text, width, size, "helv")
    for i, ln in enumerate(lines):
        need(size * 1.32)
        if i == 0:
            page.insert_text(fitz.Point(M + 2, y + size), "-",
                             fontsize=size, fontname="helv", color=INK)
        page.insert_text(fitz.Point(M + 14, y + size), ln,
                         fontsize=size, fontname="helv", color=INK)
        y += size * 1.32
    y += 1.6

def role(title, org, dates):
    global y
    need(26)
    write(title, size=10.4, font="hebo", gap=0.5)
    write(org + "  |  " + dates, size=8.8, colour=MUT, gap=3)

# ---------- header ----------
write("AHSAAN MUNIR", size=19, font="hebo", gap=1)
write("Full Stack & AI/ML Engineer", size=10.6, colour=MUT, gap=2)
write("Lahore, Pakistan  |  +92 314 6392517  |  ahsaanmunir141@gmail.com", size=8.8, colour=MUT, gap=0.5)
write("linkedin.com/in/ahsaan-munir-3a288a321  |  github.com/ahsaanmunir53", size=8.8, colour=MUT, gap=2)
page.draw_line(fitz.Point(M, y), fitz.Point(W - M, y), color=RULE, width=0.9)
y += 6

heading("Professional Summary")
write("Software Engineer specializing in full-stack and AI/ML development. Experienced in building "
      "scalable web applications with React, Node.js, and Python, and in developing deep learning "
      "models for computer vision and NLP. Currently a MERN Stack Developer Intern at Infotech under "
      "the CMIT Program 2026, with ten live production deployments and hands-on experience serving "
      "international clients under real deadlines.")

heading("Technical Skills")
for label, items in [
    ("Languages", "Python, JavaScript, C++"),
    ("Frontend", "React.js, HTML5, CSS3"),
    ("Backend", "Node.js, Express.js, Django, Flask, FastAPI"),
    ("Databases", "MongoDB, MySQL, SQL Server"),
    ("AI / ML", "TensorFlow, Scikit-learn, OpenCV, CNN, LSTM, BiLSTM, Attention, Computer Vision, NLP, RAG"),
    ("Tools & Methods", "Docker, Git, GitHub, REST APIs, Cloud Computing, Agile, Scrum"),
]:
    write(label + ":  " + items, size=9.4, gap=1.2)

heading("Experience")
role("MERN Stack Developer Intern", "Infotech (CMIT Program 2026), Lahore", "2026 - Present")
bullet("Developing full-stack features across MongoDB, Express.js, React, and Node.js on company projects as part of the CMIT Program 2026.")
bullet("Working with Infotech's development team on Git-based workflows and feature delivery.")
y += 3

role("Software Engineer & AI/ML Developer (Freelance)", "Self-Employed (German Client), Remote", "Nov 2025 - Present")
bullet("Developing a live production project for a German client across Python backend, ML model training, and React frontend features.")
bullet("Writing production-ready code under real business deadlines while gathering requirements from non-technical stakeholders.")
bullet("Context-switching rapidly between full-stack and AI/ML tasks to meet evolving project needs.")
y += 3

role("Web Development Intern", "InternNCraft, On-site", "Dec 2024 - Jan 2025")
bullet("Developed full-stack E-Commerce and E-Learning platforms on the MERN stack (MongoDB, Express.js, React, Node.js).")
bullet("Built secure admin dashboards with authentication, role management, and payment gateway integration.")
bullet("Designed and optimized REST APIs, improving application performance by 40%.")

heading("Projects")
projects = [
    ("DocMind - Document Intelligence & ATS CV Studio", "docqa-3nqw.onrender.com",
     "Django RAG platform for large PDFs: hybrid BM25 + vector retrieval with page-cited answers, "
     "figure and signature detection, and an ATS CV tailoring studio with gap interview and fabrication checking."),
    ("Monal AI - Bilingual Voice Receptionist", "monal-ai.onrender.com",
     "Real-time bilingual (Urdu & English) AI phone agent that answers calls, takes reservations, and confirms "
     "bookings automatically; speech-to-text, LLM, and text-to-speech pipeline with a live React dashboard and "
     "automated WhatsApp confirmations via the WhatsApp Business API."),
    ("Sign Bridge - Urdu Sign Language Translator", "sign-web-v7cj.onrender.com",
     "AI model reaching 85%+ accuracy for Urdu Sign Language recognition using CNN, BiLSTM, and Attention; "
     "full-stack system with React, Node.js, and a Flask ML API."),
    ("Stock Prediction & Fraud Detection System", "",
     "LSTM-based stock-price prediction model and a fraud-detection classifier reaching 92% accuracy with "
     "Scikit-learn and TensorFlow."),
    ("MAHRU - AI-Powered E-Commerce Platform", "mahru-store.onrender.com",
     "MERN e-commerce application with an ML-driven product recommendation system, Stripe payment integration, "
     "an admin dashboard, and full user management."),
]
for name, url, desc in projects:
    head = name + ("  |  " + url if url else "")
    write(head, size=9.8, font="hebo", gap=0.5)
    bullet(desc)
    y += 1.5

heading("Education")
write("Bachelor of Science in Computer Science", size=10, font="hebo", gap=0.5)
write("University of Management & Technology (UMT), Lahore  |  2021 - 2025", size=8.8, colour=MUT, gap=2)

heading("Languages")
write("Urdu (Native)  ·  English (Fluent)  ·  German (Beginner)", size=9.4)

doc.save("Ahsaan-Munir-CV.pdf")
print("pages:", doc.page_count)
