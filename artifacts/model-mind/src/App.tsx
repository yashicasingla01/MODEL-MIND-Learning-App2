import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Link, Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Atom, BookOpen, Check, CheckCircle2,
  ChevronRight, CircleHelp, Clock3, FileText, FlaskConical, Gauge, Lightbulb,
  ListChecks, LockKeyhole, Menu, MessageSquareText, Minus, Play, Plus, RotateCcw, Search,
  Send, ShieldCheck, Target, Timer, Trash2, Upload, X,
} from "lucide-react";
import {
  type Attempt, type Citation, type Mastery, type QuestionMode, type QuizQuestion, type Source, type StoredData,
  type TutorTurn, findEvidence, isAnswerCorrect, makeQuizQuestions, readStoredData, saveStoredData, sentenceRows,
} from "@/lib/model";

type ModelContextValue = {
  data: StoredData;
  replaceData: (next: StoredData | ((previous: StoredData) => StoredData)) => void;
  notify: (message: string) => void;
};
const ModelContext = createContext<ModelContextValue | null>(null);
function useModel() {
  const value = useContext(ModelContext);
  if (!value) throw new Error("Model Mind state is unavailable");
  return value;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/materials", label: "Course Material", icon: BookOpen },
  { href: "/tutor", label: "AI Tutor", icon: MessageSquareText },
  { href: "/quiz", label: "Adaptive Quiz", icon: ListChecks },
  { href: "/mock-test", label: "Mock Test", icon: Timer },
  { href: "/mastery", label: "Mastery", icon: Target },
  { href: "/evaluation", label: "Evaluation", icon: Activity },
];
const titleByPath: Record<string, string> = {
  "/": "Dashboard", "/materials": "Course Material", "/tutor": "AI Tutor", "/quiz": "Adaptive Quiz",
  "/mock-test": "Mock Test", "/mastery": "Mastery", "/evaluation": "Evaluation",
};

function ModelApp() {
  const [data, setData] = useState<StoredData>(() => readStoredData());
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);
  useEffect(() => saveStoredData(data), [data]);
  const notify = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2700);
  };
  const replaceData = (next: StoredData | ((previous: StoredData) => StoredData)) =>
    setData((previous) => typeof next === "function" ? next(previous) : next);
  return (
    <ModelContext.Provider value={{ data, replaceData, notify }}>
      <Shell />
      {toast && <div role="status" className="toast-msg" data-testid="status-toast">{toast}</div>}
    </ModelContext.Provider>
  );
}

function Shell() {
  const [path] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const date = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
  const active = (href: string) => path === href ? "active" : "";
  useEffect(() => {
    const pageTitle = titleByPath[path] || "Study space";
    const descriptions: Record<string, string> = {
      "/": "Track your course sources, practice sessions, topic mastery, and recommended next steps in MODEL MIND.",
      "/materials": "Add PDF, PowerPoint, text, video references, and timestamped transcript notes to your local MODEL MIND study library.",
      "/tutor": "Search your course material for exact passages with page, slide, or timestamp citations.",
      "/quiz": "Practice MCQ, short-answer, or numerical questions built from the sources in your MODEL MIND library.",
      "/mock-test": "Take a timed, mixed-format source-recall test and review topic-level results.",
      "/mastery": "Review topic-level mastery, identify weak areas, and choose your next study activity.",
      "/evaluation": "Review your practice history, topic outcomes, and personalized next steps.",
    };
    const description = descriptions[path] || "A local-first study workspace for course material and source-grounded practice.";
    document.title = `${pageTitle} | MODEL MIND`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", document.title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);
  }, [path]);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Model Mind overview">
          <span className="brand-mark">M</span>
          <span><span className="brand-name">MODEL MIND</span><span className="brand-tag">Your Course. Your Sources. Your Learning Path.</span></span>
        </Link>
        <div className="nav-label">Study space</div>
          <nav aria-label="Main navigation">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-link ${active(href)}`} data-testid={`link-${label.toLowerCase().replaceAll(" ", "-")}`}>
              <Icon className="nav-icon" strokeWidth={1.8} /><span>{label}</span>
              {path === href && <ChevronRight size={13} style={{ marginLeft: "auto" }} />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-label">Active course</div>
          <div className="course-switch">
            <div className="row space-between"><span className="course-eyebrow">THIS SEMESTER</span><Atom size={15} color="#efc465" /></div>
            <div className="course-name">Introductory Biology</div>
            <div className="course-meta">5 topics · {useModel().data.sources.length} sources</div>
          </div>
          <div className="profile">
            <div className="avatar">ST</div><div><div className="profile-name">Study workspace</div><div className="profile-detail">Saved in this browser</div></div>
          </div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open more study pages" onClick={() => setMobileOpen((value) => !value)} data-testid="button-open-mobile-menu"><Menu size={17} /></button>
          <div className="crumb">Introductory Biology <span style={{ margin: "0 8px", color: "#c8c5b9" }}>/</span> {titleByPath[path] || "Study space"}</div>
          <div className="top-actions"><span className="local-badge"><span className="local-dot" />LOCAL STUDY MODE</span><span className="date-label">{date}</span></div>
        </header>
        <main className="content">
          <Switch>
            <Route path="/" component={DashboardPage} />
            <Route path="/materials" component={MaterialsPage} />
            <Route path="/tutor" component={TutorPage} />
            <Route path="/quiz" component={QuizPage} />
            <Route path="/mock-test" component={MockTestPage} />
            <Route path="/mastery" component={MasteryPage} />
            <Route path="/evaluation" component={EvaluationPage} />
            <Route component={NotFoundPage} />
          </Switch>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`mobile-link ${active(href)}`} onClick={() => setMobileOpen(false)}>
              <Icon strokeWidth={1.8} /><span>{label === "Course Material" ? "Materials" : label === "Adaptive Quiz" ? "Quiz" : label}</span>
          </Link>
        ))}
      </nav>
      {mobileOpen && <div className="mobile-nav-extra">{navItems.slice(5).map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="page-heading animate-enter"><div><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div>{action}</div>;
}
function Panel({ children, className = "", style, id }: { children: ReactNode; className?: string; style?: CSSProperties; id?: string }) {
  return <section id={id} className={`panel ${className}`} style={style}>{children}</section>;
}
function PanelHeading({ title, caption, action }: { title: string; caption?: string; action?: ReactNode }) {
  return <div className="panel-head"><div><h2 className="panel-title">{title}</h2>{caption && <div className="panel-caption">{caption}</div>}</div>{action}</div>;
}
function TinyStat({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: typeof Atom }) {
  return <Panel className="mini-stat"><div className="stat-top"><span>{label}</span><Icon size={15} /></div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></Panel>;
}
function ProgressBar({ score }: { score: number }) {
  return <div className="progress-track" aria-label={`${score}% mastery`}><div className={`progress-fill ${score < 50 ? "low" : score < 70 ? "mid" : ""}`} style={{ transform: `scaleX(${Math.max(0, Math.min(100, score)) / 100})` }} /></div>;
}
function TopicList({ limit }: { limit?: number }) {
  const { data } = useModel();
  return <div>{data.mastery.slice(0, limit).map((topic) => <div className="topic-row" key={topic.topic} data-testid={`topic-row-${topic.topic.toLowerCase().replaceAll(" ", "-")}`}>
    <div><div className="topic-name">{topic.topic}</div><div style={{ marginTop: 7 }}><ProgressBar score={topic.score} /></div></div>
    <div className="topic-score">{topic.score}%</div>
    <span className={`tag ${topic.score < 50 ? "tag-coral" : topic.score < 70 ? "tag-amber" : ""}`}>{topic.score < 50 ? "Focus" : topic.score < 70 ? "Building" : "Steady"}</span>
  </div>)}</div>;
}
function recommendations(mastery: Mastery[]): { topic: string; activity: string; reason: string }[] {
  return [...mastery].sort((a, b) => a.score - b.score).slice(0, 3).map((item) => ({
    topic: item.topic,
    activity: item.score < 50 ? "Do a 5-question recall set" : "Review one source, then practise",
    reason: item.attempts ? `Your current recall is ${item.score}%. A short revisit can strengthen this topic.` : "This topic has not been practised yet.",
  }));
}
function DashboardPage() {
  const { data } = useModel();
  const rec = recommendations(data.mastery)[0];
  const attempts = data.attempts;
  const questionTotal = attempts.reduce((sum, item) => sum + item.total, 0);
  const correctTotal = attempts.reduce((sum, item) => sum + item.correct, 0);
  const average = questionTotal ? Math.round(correctTotal / questionTotal * 100) : 0;
  const sessionCount = new Set(attempts.map((item) => item.completedAt)).size;
  return <>
    <PageHeading eyebrow="YOUR STUDY DESK" title="Make the next hour count." subtitle="Your course materials, practice, and progress in one focused space." />
    <div className="grid grid-two animate-enter animate-delay-1">
      <section className="hero-panel"><div className="hero-content">
        <div className="hero-label">YOUR NEXT BEST MOVE</div>
        <h2 className="hero-title">{rec ? `Revisit ${rec.topic.toLowerCase()}.` : "Bring your course into focus."}</h2>
        <p className="hero-copy">{rec ? rec.reason : "Add your lecture notes and readings, then turn them into source-grounded practice."} Model Mind only works from the material you can see here.</p>
        <Link href={rec ? "/quiz" : "/materials"} className="button button-primary">{rec ? "Start a short recall set" : "Add course materials"}<ArrowRight size={15} /></Link>
      </div></section>
      <Panel className="panel-pad" style={{ background: "#f0eee3" }}>
        <div className="row space-between"><div><div className="eyebrow" style={{ marginBottom: 8 }}>YOUR COURSE RIGHT NOW</div><div className="section-label" style={{ fontSize: 17 }}>Introductory Biology</div></div><div className="activity-icon"><FlaskConical size={18} /></div></div>
        <div className="divider" />
        <div className="grid grid-equal">
          <div><div className="stat-value" style={{ fontSize: 22 }}>{data.sources.length}</div><div className="stat-hint">sources in your library</div></div>
          <div><div className="stat-value" style={{ fontSize: 22 }}>{sessionCount}</div><div className="stat-hint">practice sessions</div></div>
        </div>
        <div className="divider" />
        <div className="row space-between"><span style={{ fontSize: 11, color: "#76847c" }}>Practice average</span><span style={{ font: "500 12px 'DM Mono'", color: "#377565" }}>{attempts.length ? `${average}%` : "Not started"}</span></div>
        <div style={{ marginTop: 9 }}><ProgressBar score={average} /></div>
      </Panel>
    </div>
    <div className="grid grid-three" style={{ marginTop: 16 }}>
      <TinyStat label="TOPICS TO EXPLORE" value={`${data.mastery.length}`} hint="Mapped from your course" icon={Target} />
      <TinyStat label="SOURCE LIBRARY" value={`${data.sources.length}`} hint={data.sources.some((s) => !s.demo) ? "Includes your uploads" : "Sample course is ready"} icon={BookOpen} />
      <TinyStat label="GROUNDED ANSWERS" value={`${data.turns.filter((t) => t.grounded).length}`} hint="With exact source citations" icon={ShieldCheck} />
    </div>
    <div className="grid grid-two" style={{ marginTop: 16 }}>
      <Panel><PanelHeading title="Topics worth a second look" caption="A living picture of your recall" action={<Link href="/mastery" className="text-link">See all <ArrowRight size={12} /></Link>} /><div className="panel-pad" style={{ paddingTop: 4 }}><TopicList limit={4} /></div></Panel>
      <Panel><PanelHeading title="Your study loop" caption="Pick up where curiosity takes you" /><div className="panel-pad" style={{ paddingTop: 5 }}>
        <ActivityRow icon={Upload} title="Add course material" detail="Bring in a reading, slide deck, or lecture notes" href="/materials" />
        <ActivityRow icon={MessageSquareText} title="Ask with your sources" detail="Answers show the exact passage they came from" href="/tutor" />
        <ActivityRow icon={ListChecks} title="Practise what you know" detail="Recall checks are built from stored text" href="/quiz" />
        {attempts.length > 0 && <ActivityRow icon={CheckCircle2} title={`${sessionCount} practice sessions completed`} detail="Your answers shape topic recommendations" href="/evaluation" />}
      </div></Panel>
    </div>
    <p style={{ fontSize: 10, color: "#8b938b", marginTop: 17 }}><LockKeyhole size={11} style={{ verticalAlign: "middle", marginRight: 5 }} />Your study data stays in this browser. The sample biology reader is clearly marked and is not one of your uploads.</p>
  </>;
}
function ActivityRow({ icon: Icon, title, detail, href }: { icon: typeof Atom; title: string; detail: string; href: string }) {
  return <Link href={href} className="activity-row" style={{ textDecoration: "none" }}><div className="activity-icon"><Icon size={17} /></div><div className="activity-main"><div className="activity-name">{title}</div><div className="activity-desc">{detail}</div></div><ChevronRight size={15} color="#9ba39a" /></Link>;
}

function MaterialsPage() {
  const { data, replaceData, notify } = useModel();
  const [tab, setTab] = useState<"upload" | "library">("upload");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [transcriptName, setTranscriptName] = useState("");
  const [videoName, setVideoName] = useState("");
  const [dropActive, setDropActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = data.sources.filter((source) => `${source.name} ${source.type}`.toLowerCase().includes(query.toLowerCase()));
  async function ingest(files: FileList | File[]) {
    if (!files.length) return;
    setBusy(true);
    try {
      const parsed: Source[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name} is over the 20 MB browser-processing limit.`);
        const name = file.name;
        const ext = name.split(".").pop()?.toLowerCase();
        const type = ext === "pdf" ? "PDF" : ext === "pptx" ? "PPTX" : "Text";
        let extractedText = "";
        let pagesOrSlides = 1;
        if (ext === "txt" || ext === "md" || ext === "text") {
          extractedText = await file.text();
        } else if (ext === "pdf") {
          const result = await extractPdf(file);
          extractedText = result.text;
          pagesOrSlides = result.pages;
        } else if (ext === "pptx") {
          const result = await extractPptx(file);
          extractedText = result.text;
          pagesOrSlides = result.slides;
        } else {
          throw new Error(`“${name}” is not supported. Choose a PDF, PPTX, or plain-text file.`);
        }
        extractedText = extractedText.replace(/\u0000/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
        if (extractedText.length < 40) throw new Error(`We couldn't find readable text in ${name}. Scanned PDFs and image-only slides need OCR, which is not available in this local MVP.`);
        parsed.push({ id: crypto.randomUUID(), name, type, pagesOrSlides, extractedText: extractedText.slice(0, 1_000_000), addedAt: new Date().toISOString() });
      }
      replaceData((prev) => ({ ...prev, sources: [...parsed, ...prev.sources] }));
      setTab("library");
      notify(`${parsed.length} ${parsed.length === 1 ? "source" : "sources"} extracted in your browser.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "The file could not be processed.");
    } finally {
      setBusy(false);
    }
  }
  function addTranscript(event: FormEvent) {
    event.preventDefault();
    if (transcript.trim().length < 40) { notify("Add a little more transcript text before saving."); return; }
    if (!/\b\d{1,2}:\d{2}\b/.test(transcript)) { notify("Add timestamps such as 02:14 to at least one transcript segment."); return; }
    const isVideo = Boolean(videoName);
    const source: Source = {
      id: crypto.randomUUID(), name: transcriptName.trim() || videoName || "Lecture transcript",
      type: isVideo ? "Video" : "Transcript", pagesOrSlides: transcript.match(/\b\d{1,2}:\d{2}\b/g)?.length || 1,
      extractedText: transcript.trim(), addedAt: new Date().toISOString(),
    };
    replaceData((prev) => ({ ...prev, sources: [source, ...prev.sources] }));
    setTranscript(""); setTranscriptName(""); setVideoName(""); setTab("library");
    notify(isVideo ? "Video source and timestamped notes saved in this browser." : "Lecture notes saved to your browser.");
  }
  function removeSource(source: Source) {
    if (source.demo) { notify("The sample reader is part of this demo course and cannot be removed."); return; }
    replaceData((prev) => ({ ...prev, sources: prev.sources.filter((item) => item.id !== source.id) }));
    notify("Source removed from this browser.");
  }
  return <>
    <PageHeading eyebrow="YOUR COURSE, IN ONE PLACE" title="Course materials" subtitle="Bring readings and slides together. Text is extracted and stored on this device." action={<button className="button button-primary" onClick={() => { setTab("upload"); document.getElementById("material-upload")?.scrollIntoView({ behavior: "smooth" }); }} data-testid="button-add-material"><Plus size={15} />Add material</button>} />
    <div className="grid grid-three" style={{ marginBottom: 17 }}>
      <TinyStat label="SOURCES" value={String(data.sources.length)} hint="Sample and personal sources" icon={FileText} />
      <TinyStat label="EXTRACTED TEXT" value={data.sources.length ? `${(data.sources.reduce((sum, s) => sum + s.extractedText.length, 0) / 1000).toFixed(1)}k` : "0"} hint="Characters available to study" icon={Search} />
      <TinyStat label="PROCESSING" value="On device" hint="No file uploads to a server" icon={LockKeyhole} />
    </div>
    <Panel id="material-upload">
      <div className="panel-head"><div className="row" style={{ gap: 17 }}>
        <button className={`text-link ${tab === "upload" ? "selected-tab" : ""}`} onClick={() => setTab("upload")} data-testid="tab-upload-materials">Add materials</button>
        <button className={`text-link ${tab === "library" ? "selected-tab" : ""}`} onClick={() => setTab("library")} data-testid="tab-source-library">Source library <span className="tag tag-slate" style={{ marginLeft: 5 }}>{data.sources.length}</span></button>
      </div><span className="tag">LOCAL ONLY</span></div>
      {tab === "upload" ? <div className="panel-pad">
        <div className={`upload-zone ${dropActive ? "drop-active" : ""}`} onDragOver={(event) => { event.preventDefault(); setDropActive(true); }} onDragLeave={() => setDropActive(false)} onDrop={(event) => { event.preventDefault(); setDropActive(false); void ingest(event.dataTransfer.files); }}>
          <div className="upload-icon">{busy ? <RotateCcw size={19} className="spin-icon" /> : <Upload size={19} />}</div>
          <div className="upload-title">{busy ? "Reading your material…" : "Drop your course files here"}</div>
          <div className="upload-copy">PDF, PowerPoint (.pptx), or plain text · up to 20 MB each</div>
          <button className="button button-dark" onClick={() => inputRef.current?.click()} disabled={busy} data-testid="button-choose-files"><Upload size={14} />Choose files</button>
          <input ref={inputRef} type="file" accept=".pdf,.pptx,.txt,.md,.text" multiple hidden onChange={(event) => { if (event.target.files) void ingest(event.target.files); event.currentTarget.value = ""; }} data-testid="input-material-files" />
        </div>
        <div className="grid grid-two" style={{ marginTop: 18, alignItems: "start" }}>
          <div><div className="section-label">What happens to your files?</div><ul className="capability-list">
            <li><Check size={13} />PDF text and PPTX slide text are read in your browser with page and slide references.</li>
            <li><Check size={13} />The extracted text is saved only in this browser's local storage.</li>
            <li><Minus size={13} />Scanned pages need OCR. Video transcription is not automatic.</li>
          </ul><p className="capability-note">This local MVP uses source search, not generative AI. Upload a lecture video as a source and add timestamped transcript notes; the video file itself is not stored.</p></div>
          <form onSubmit={addTranscript}>
            <div className="section-label" style={{ marginBottom: 11 }}>Add a lecture video or transcript</div>
            <div className="field"><label className="field-label" htmlFor="video-file">Lecture video file (optional)</label><input id="video-file" className="input" type="file" accept="video/mp4,video/webm,video/quicktime,.m4v" onChange={(e) => setVideoName(e.target.files?.[0]?.name || "")} data-testid="input-video-file" /><div className="file-meta">{videoName ? `Selected: ${videoName}` : "MP4, MOV, M4V, or WebM · local reference only"}</div></div>
            <div className="field"><label className="field-label" htmlFor="transcript-name">{videoName ? "Source title" : "Lecture name"}</label><input id="transcript-name" className="input" placeholder={videoName ? "Uses video filename" : "e.g. Cell membranes · week 3"} value={transcriptName} onChange={(e) => setTranscriptName(e.target.value)} data-testid="input-transcript-name" /></div>
            <div className="field"><label className="field-label" htmlFor="transcript-text">Notes with timestamps</label><textarea id="transcript-text" className="textarea transcript-box" placeholder={"02:14 The phospholipid bilayer forms the membrane…\n05:32 Diffusion moves particles down their concentration gradient…"} value={transcript} onChange={(e) => setTranscript(e.target.value)} data-testid="input-transcript-text" /></div>
            <button className="button button-quiet" type="submit" data-testid="button-save-transcript"><Plus size={14} />Save {videoName ? "video source + notes" : "transcript notes"}</button>
          </form>
        </div>
      </div> : <div>
        <div style={{ padding: "14px 20px", display: "flex", gap: 10 }}><div style={{ position: "relative", flex: 1 }}><Search size={14} style={{ position: "absolute", left: 11, top: 12, color: "#86928a" }} /><input className="input" style={{ paddingLeft: 34 }} placeholder="Search your source library" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="input-search-sources" /></div><span className="tag">{filtered.length} sources</span></div>
        {filtered.length ? <div className="file-list">{filtered.map((source) => <SourceRow source={source} onRemove={() => removeSource(source)} key={source.id} />)}</div> : <div className="empty-state"><div className="empty-mark"><Search size={18} /></div><strong>No matching materials</strong><span>Try a different title or add a course source.</span></div>}
      </div>}
    </Panel>
    {tab === "upload" && <Panel style={{ marginTop: 16 }}><PanelHeading title="Already in your study space" caption="The sample course is for exploring the full learning loop" action={<button className="text-link" onClick={() => setTab("library")}>Open library <ArrowRight size={12} /></button>} /><div className="file-list">{data.sources.slice(0, 3).map((source) => <SourceRow source={source} key={source.id} onRemove={() => removeSource(source)} />)}</div></Panel>}
  </>;
}
function SourceRow({ source, onRemove }: { source: Source; onRemove: () => void }) {
  const rows = sentenceRows(source).length;
  const date = source.demo ? "Sample course material" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(source.addedAt));
  return <div className="file-row" data-testid={`source-row-${source.id}`}>
    <div className={`file-type ${source.demo ? "demo-type" : ""}`}>{source.type}</div>
    <div className="file-main"><div className="row" style={{ gap: 8 }}><div className="file-name">{source.name}</div>{source.demo && <span className="tag tag-amber">DEMO SAMPLE</span>}</div><div className="file-meta">{source.pagesOrSlides} {source.type === "PPTX" ? "slides" : source.type === "Transcript" || source.type === "Video" ? "timestamped segments" : "pages"} · {rows} readable excerpts · {date}</div><div className="source-text">{source.extractedText.slice(0, 150)}{source.extractedText.length > 150 ? "…" : ""}</div></div>
    {!source.demo && <button className="icon-btn" aria-label={`Remove ${source.name}`} onClick={onRemove} data-testid={`button-remove-source-${source.id}`}><Trash2 size={15} /></button>}
  </div>;
}

async function extractPdf(file: File): Promise<{ text: string; pages: number }> {
  const [pdfjsLib, workerModule] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item) => "str" in item ? item.str : "").filter(Boolean).join(" ");
      if (text.trim()) pages.push(`PAGE ${pageNumber}\n${text}`);
      page.cleanup();
    }
    return { text: pages.join("\n\n"), pages: pdf.numPages };
  } finally {
    await pdf.cleanup();
  }
}

async function extractPptx(file: File): Promise<{ text: string; slides: number }> {
  const JSZip = (await import("jszip")).default;
  const archive = await JSZip.loadAsync(file);
  const names = Object.keys(archive.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]));
  const slides: string[] = [];
  for (const name of names) {
    const xml = await archive.file(name)?.async("text");
    if (!xml) continue;
    const document = new DOMParser().parseFromString(xml, "application/xml");
    const textNodes = document.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "t");
    const text = Array.from(textNodes).map((node) => node.textContent || "").join(" ").trim();
    if (text) slides.push(`SLIDE ${Number(name.match(/slide(\d+)/)?.[1])}\n${text}`);
  }
  return { text: slides.join("\n\n"), slides: names.length };
}

function TutorPage() {
  const { data, replaceData } = useModel();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const examples = ["How does osmosis work?", "What does the plasma membrane do?", "Where does photosynthesis take place?"];
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data.turns.length]);
  function ask(event?: FormEvent, asked?: string) {
    event?.preventDefault();
    const question = (asked ?? draft).trim();
    if (!question) return;
    const citations = findEvidence(question, data.sources);
    const grounded = citations.length > 0;
    const answer = grounded
      ? citations.map((citation) => `“${citation.text}”`).join("\n\n") + "\n\nThese are exact excerpts from your stored course material. I have not added information beyond them."
      : "I can’t ground an answer to that in the material in this course library. I won’t fill the gap with a guess. Add a relevant reading or lecture transcript, or try asking about a term that appears in your sources.";
    const turn: TutorTurn = { id: crypto.randomUUID(), question, answer, citations: grounded ? citations : [], grounded, at: new Date().toISOString() };
    replaceData((previous) => ({ ...previous, turns: [...previous.turns, turn] }));
    setDraft("");
  }
  return <>
    <PageHeading eyebrow="ASK THE MATERIAL, NOT A BOT" title="Source tutor" subtitle="Ask a question. Get exact passages from your course—or an honest “not in these sources.”" />
    <div className="chat-layout">
      <Panel className="chat-card">
        <div className="chat-intro"><div className="row space-between"><div><div className="chat-title">Introductory Biology · grounded answers</div><p className="chat-note">Local extractive search compares your question with stored source excerpts. There is no remote AI response.</p></div><span className="tag"><ShieldCheck size={11} style={{ marginRight: 5 }} />SOURCE-BOUND</span></div></div>
        <div className="messages">
          {!data.turns.length && <div style={{ padding: "18px 0 28px" }}><div className="message-label">MODEL MIND · SOURCE SEARCH</div><div className="bubble">I can find relevant passages in your Introductory Biology materials. I quote the source text exactly and show where it came from. If your sources don't say, I'll tell you.</div></div>}
          {data.turns.map((turn) => <div key={turn.id}>
            <div className="message user"><div className="message-label">YOU · {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(turn.at))}</div><div className="bubble">{turn.question}</div></div>
            <div className="message"><div className="message-label">{turn.grounded ? "MODEL MIND · FOUND IN YOUR MATERIAL" : "MODEL MIND · NOT IN THESE SOURCES"}</div><div className="bubble">{turn.answer}{turn.citations.map((citation, index) => <CitationCard citation={citation} key={`${turn.id}-${index}`} />)}</div></div>
          </div>)}
          <div ref={endRef} />
        </div>
        <form className="chat-compose" onSubmit={(event) => ask(event)}>
          <textarea className="textarea" aria-label="Ask about your course material" placeholder="Ask about something in your sources…" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(); } }} data-testid="input-tutor-question" />
          <button className="button button-primary" type="submit" disabled={!draft.trim()} data-testid="button-ask-tutor"><Send size={14} />Ask</button>
        </form>
      </Panel>
      <div className="chat-side">
        <Panel className="panel-pad"><div className="section-label">Try a question</div><p style={{ fontSize: 10, lineHeight: 1.5, color: "#859087", margin: "6px 0 10px" }}>A few prompts grounded in the sample course reader.</p>{examples.map((question) => <button className="suggestion" key={question} onClick={() => ask(undefined, question)}>{question}<ArrowUpRight size={12} style={{ float: "right", marginTop: 1 }} /></button>)}</Panel>
        <Panel className="panel-pad" style={{ marginTop: 14 }}><div className="row" style={{ gap: 8 }}><LockKeyhole size={15} color="#438271" /><div className="section-label">A note on answers</div></div><p style={{ fontSize: 10, lineHeight: 1.65, color: "#7e8981", margin: "10px 0 0" }}>This study companion matches words in your question against sentence excerpts. It is not an AI tutor: no answer is invented, inferred, or generated from outside material.</p><div className="divider" /><Link className="text-link" href="/materials">Manage course sources <ArrowRight size={12} /></Link></Panel>
        <Panel className="panel-pad" style={{ marginTop: 14 }}><div className="row space-between"><div className="section-label">Grounded answers</div><span className="stat-value" style={{ fontSize: 18, margin: 0 }}>{data.turns.filter((turn) => turn.grounded).length}</span></div><div className="panel-caption">out of {data.turns.length} questions in this browser</div></Panel>
      </div>
    </div>
  </>;
}
function CitationCard({ citation }: { citation: Citation }) {
  return <div className="citation"><div className="citation-head">{citation.sourceName} · {citation.location} · {citation.label}</div><div className="citation-text">{citation.text}</div></div>;
}

function PracticePage({ timed }: { timed: boolean }) {
  const { data, replaceData, notify } = useModel();
  const [mode, setMode] = useState<Exclude<QuestionMode, "mixed">>("multiple-choice");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(600);
  const [done, setDone] = useState(false);
  const [startedAt, setStartedAt] = useState("");
  const hasQuestions = questions.length > 0;
  useEffect(() => {
    if (!running || !timed || done) return;
    const interval = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [running, timed, done]);
  useEffect(() => { if (timed && running && seconds === 0 && !done) finish(); }, [seconds, timed, running, done]);
  const score = useMemo(() => questions.reduce((count, question) => count + (isAnswerCorrect(question, answers[question.id] || "") ? 1 : 0), 0), [answers, questions]);
  function begin() {
    const focusTopic = timed ? undefined : [...data.mastery].sort((a, b) => a.score - b.score)[0]?.topic;
    const fresh = makeQuizQuestions(data.sources, timed ? 10 : 5, focusTopic, timed ? "mixed" : mode);
    if (!fresh.length) {
      notify(mode === "numerical" && !timed ? "No numerical facts found in these sources. Add material with a number, then try again." : "Add readable course text before starting practice.");
      return;
    }
    setQuestions(fresh); setIndex(0); setAnswers({}); setSelected(""); setSubmitted(false); setDone(false); setSeconds(600); setRunning(true); setStartedAt(new Date().toISOString());
  }
  function submitAnswer() {
    if (!questions[index] || !selected) return;
    setAnswers((previous) => ({ ...previous, [questions[index].id]: selected }));
    setSubmitted(true);
  }
  function nextQuestion() {
    if (index >= questions.length - 1) finish({ ...answers, [questions[index].id]: selected });
    else { setIndex((value) => value + 1); setSelected(""); setSubmitted(false); }
  }
  function finish(finalAnswers = answers) {
    if (done || !questions.length) return;
    setAnswers(finalAnswers); setDone(true); setRunning(false);
    const grouped = new Map<string, { correct: number; total: number }>();
    for (const question of questions) {
      const value = grouped.get(question.topic) || { correct: 0, total: 0 };
      value.total += 1;
      if (isAnswerCorrect(question, finalAnswers[question.id] || "")) value.correct += 1;
      grouped.set(question.topic, value);
    }
    const now = new Date().toISOString();
    const addedAttempts: Attempt[] = [...grouped.entries()].map(([topic, value]) => ({ id: crypto.randomUUID(), topic, correct: value.correct, total: value.total, completedAt: now }));
    replaceData((previous) => {
      const mastery = previous.mastery.map((item) => {
        const record = grouped.get(item.topic);
        if (!record) return item;
        const earned = record.correct / Math.max(1, record.total) * 100;
        return { ...item, score: Math.round(item.score * 0.55 + earned * 0.45), attempts: item.attempts + record.total, lastPracticed: "Just now" };
      });
      for (const [topic, record] of grouped) {
        if (!mastery.some((item) => item.topic === topic)) mastery.push({ topic, score: Math.round(record.correct / record.total * 100), attempts: record.total, lastPracticed: "Just now" });
      }
      return { ...previous, attempts: [...previous.attempts, ...addedAttempts], mastery };
    });
  }
  const question = questions[index];
  const timeText = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  const totalAnswered = data.attempts.reduce((sum, item) => sum + item.total, 0);
  const average = totalAnswered ? Math.round(data.attempts.reduce((sum, item) => sum + item.correct, 0) / totalAnswered * 100) : 0;
  return <>
    <PageHeading eyebrow={timed ? "10 MINUTES · MIXED TOPICS" : "A QUICK CHECK, BUILT FROM YOUR SOURCES"} title={timed ? "Mock test" : "Adaptive quiz"} subtitle={timed ? "A timed source-recall assessment. Each question links back to the material." : "Choose a question format. The next set prioritizes a topic you could strengthen."} />
    {!hasQuestions && !done && <div className="grid grid-two" style={{ alignItems: "start" }}>
      <Panel className="panel-pad" style={{ background: "#1d383d", color: "#f1f1e8" }}>
        <div className="hero-label">{timed ? "MOCK ASSESSMENT" : "SOURCE RECALL"}</div><h2 className="hero-title" style={{ color: "#f1f1e8", marginTop: 12 }}>{timed ? "Ten minutes. Your material only." : "A useful five-minute reset."}</h2>
        <p className="hero-copy">Questions are built from exact sentences in your stored course text. Your answer updates the topic mastery model in this browser.</p>
        <div className="row" style={{ gap: 9, marginBottom: 19, flexWrap: "wrap" }}><span className="tag tag-amber">{timed ? "10 QUESTIONS" : "5 QUESTIONS"}</span>{timed && <span className="tag tag-amber">10:00 TIMER</span>}<span className="tag tag-amber">CITATIONS INCLUDED</span></div>
        {!timed && <div style={{ marginBottom: 17 }}>
          <div className="hero-label" style={{ marginBottom: 9 }}>QUESTION FORMAT</div>
          <div className="format-options">
            {([
              ["multiple-choice", "MCQ"],
              ["short-answer", "Short answer"],
              ["numerical", "Numerical"],
            ] as const).map(([value, label]) => {
              const hasNumbers = data.sources.some((source) => sentenceRows(source).some((row) => /\b\d+(?:\.\d+)?\b/.test(row.text)));
              return <button key={value} className={`format-option ${mode === value ? "format-option-active" : ""}`} onClick={() => setMode(value)} aria-pressed={mode === value} disabled={value === "numerical" && !hasNumbers} data-testid={`button-format-${value}`}>{label}</button>;
            })}
          </div>
          <div className="format-hint">Short answers use a visible keyword check. Numerical practice is enabled when a source contains numbers.</div>
        </div>}
        <button className="button button-amber" onClick={begin} data-testid={timed ? "button-start-mock-test" : "button-start-quiz"}><Play size={14} />Start {timed ? "mock test" : "practice"}</button>
      </Panel>
      <div className="grid">
        <Panel><PanelHeading title="Built from the actual text" caption="No generative question service is involved" /><div className="panel-pad"><div className="activity-row"><div className="activity-icon"><FileText size={16} /></div><div className="activity-main"><div className="activity-name">{data.sources.length} course sources</div><div className="activity-desc">Sample reader included for a ready-to-try demo.</div></div></div><div className="activity-row"><div className="activity-icon"><ShieldCheck size={16} /></div><div className="activity-main"><div className="activity-name">Every question cites a passage</div><div className="activity-desc">Answer feedback points back to the extracted excerpt.</div></div></div><Link className="text-link" href="/materials">View materials <ArrowRight size={12} /></Link></div></Panel>
        <Panel className="panel-pad"><div className="row space-between"><div><div className="stat-label">PRACTICE AVERAGE</div><div className="stat-value">{data.attempts.length ? `${average}%` : "—"}</div></div><div className="activity-icon"><Target size={17} /></div></div><div className="panel-caption">{data.attempts.length ? `${new Set(data.attempts.map((item) => item.completedAt)).size} sessions saved` : "Your first attempt will appear here."}</div></Panel>
      </div>
    </div>}
    {hasQuestions && !done && question && <Panel className="quiz-card">
      <div className="quiz-progress"><span>{timed ? "MOCK TEST" : "QUICK PRACTICE"} · QUESTION {index + 1} OF {questions.length}</span>{timed ? <span className={`timer ${seconds < 90 ? "urgent" : ""}`}><Clock3 size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />{timeText}</span> : <span>{Math.round((index + 1) / questions.length * 100)}% complete</span>}</div>
      <ProgressBar score={(index + 1) / questions.length * 100} />
      <div style={{ maxWidth: 760, margin: "26px auto 0" }}>
        <div className="question-topic">{question.topic} · {question.type}</div>
        <h2 className="question-title">{question.prompt}</h2>
        {question.type === "Multiple choice" ? <div role="radiogroup" aria-label="Answer choices">
          {question.choices.map((choice, i) => {
            const isRight = submitted && choice.toLowerCase() === question.answer.toLowerCase();
            const isWrong = submitted && selected === choice && !isRight;
            return <button className={`choice ${selected === choice ? "selected" : ""} ${isRight ? "correct" : ""} ${isWrong ? "incorrect" : ""}`} key={`${question.id}-${i}`} onClick={() => { if (!submitted) setSelected(choice); }} disabled={submitted} aria-pressed={selected === choice} data-testid={`choice-${i + 1}`}>
              <span className="choice-letter">{isRight ? <Check size={13} /> : String.fromCharCode(65 + i)}</span><span>{choice}</span>
            </button>;
          })}
        </div> : <div className="field answer-field">
          <label className="field-label" htmlFor="practice-answer">{question.type === "Numerical" ? "Your numerical answer" : "Your short answer"}</label>
          {question.type === "Numerical"
            ? <input id="practice-answer" className="input" type="number" step="any" inputMode="decimal" placeholder="Enter a number" value={selected} onChange={(event) => setSelected(event.target.value)} disabled={submitted} data-testid="input-numerical-answer" />
            : <textarea id="practice-answer" className="textarea" rows={4} placeholder="Explain in your own words…" value={selected} onChange={(event) => setSelected(event.target.value)} disabled={submitted} data-testid="input-short-answer" />}
        </div>}
        {submitted && <div className="feedback-box"><div className={`row ${isAnswerCorrect(question, selected) ? "feedback-right" : "feedback-wrong"}`}><span className="feedback-symbol">{isAnswerCorrect(question, selected) ? <CheckCircle2 size={16} /> : <CircleHelp size={16} />}</span><strong>{isAnswerCorrect(question, selected) ? "That's right." : question.type === "Short answer" ? "Review the key ideas in this passage." : `Not quite. The source gives “${question.answer}.”`}</strong></div><p>{question.type === "Short answer" ? `For this transparent quick check, include: ${question.graderTerms.join(", ")}. The source passage is shown below.` : question.explanation}</p><CitationCard citation={question.citation} /></div>}
        <div className="row space-between" style={{ marginTop: 23 }}><div style={{ fontSize: 10, color: "#89938b" }}>Question text derived from your stored course excerpt.</div>
          {!submitted ? <button className="button button-primary" onClick={submitAnswer} disabled={!selected.trim()} data-testid="button-check-answer">Check answer <ArrowRight size={14} /></button> : <button className="button button-primary" onClick={nextQuestion} data-testid="button-next-question">{index === questions.length - 1 ? "See results" : "Next question"} <ArrowRight size={14} /></button>}
        </div>
      </div>
    </Panel>}
    {done && <div className="grid grid-two" style={{ alignItems: "start" }}>
      <Panel className="panel-pad"><div className="eyebrow">SESSION COMPLETE · {startedAt ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(startedAt)) : ""}</div><div className="result-score">{score}<span style={{ fontSize: 24, color: "#8b958c" }}>/{questions.length}</span></div><h2 className="section-label" style={{ fontSize: 17, marginTop: 7 }}>{score >= questions.length * .8 ? "Strong recall." : score >= questions.length * .5 ? "Good work. A few ideas need another pass." : "A useful place to begin."}</h2><p className="page-subtitle">{timed ? "Your mock test is saved as topic-level results." : "Your practice updated mastery for each topic you met."} Review a weak area next.</p><div className="row" style={{ marginTop: 20, flexWrap: "wrap" }}><button className="button button-primary" onClick={begin} data-testid="button-practice-again"><RotateCcw size={14} />Try another set</button><Link className="button button-quiet" href="/evaluation">View evaluation <ArrowRight size={14} /></Link></div></Panel>
       <Panel><PanelHeading title="What to revisit" caption="Results saved topic by topic" /><div className="panel-pad">{questions.map((item) => { const correct = isAnswerCorrect(item, answers[item.id] || ""); return <div className="result-row" key={item.id}><div className={`result-mark ${correct ? "mark-right" : "mark-wrong"}`}>{correct ? <Check size={13} /> : <X size={13} />}</div><div style={{ flex: 1 }}><div className="activity-name">{item.topic}</div><div className="activity-desc">{correct ? "Correct recall" : "Revisit this excerpt"}</div></div><span className="tag tag-slate">{item.citation.location}</span></div>; })}</div></Panel>
    </div>}
  </>;
}
function QuizPage() { return <PracticePage timed={false} />; }
function MockTestPage() { return <PracticePage timed />; }

function MasteryPage() {
  const { data } = useModel();
  const sorted = [...data.mastery].sort((a, b) => a.score - b.score);
  const recs = recommendations(data.mastery);
  const avg = data.mastery.length ? Math.round(data.mastery.reduce((sum, item) => sum + item.score, 0) / data.mastery.length) : 0;
  return <>
    <PageHeading eyebrow="LEARNING THAT ADAPTS" title="Topic mastery" subtitle="A local estimate of recall, updated by each source-based practice session." />
    <div className="grid grid-three" style={{ marginBottom: 17 }}>
      <TinyStat label="AVERAGE MASTERY" value={`${avg}%`} hint="Across mapped course topics" icon={Gauge} />
      <TinyStat label="PRACTISED TOPICS" value={`${data.mastery.filter((item) => item.attempts).length} / ${data.mastery.length}`} hint="Try a quick check to update" icon={Target} />
      <TinyStat label="LOWEST RECALL" value={sorted[0]?.topic || "—"} hint={sorted[0] ? `${sorted[0].score}% · worth a revisit` : "No topics yet"} icon={ArrowDownRight} />
    </div>
    <div className="grid grid-two">
      <Panel><PanelHeading title="Your topic map" caption="Mastery blends prior estimate with recent practice" /><div className="panel-pad" style={{ paddingTop: 3 }}>{sorted.map((topic) => <div className="mastery-topic" key={topic.topic}>
        <div className="row space-between"><div className="section-label">{topic.topic}</div><div className="row" style={{ gap: 9 }}><span className="tag tag-slate">{topic.attempts} checks</span><span className="topic-score">{topic.score}%</span></div></div>
        <div style={{ marginTop: 11 }}><ProgressBar score={topic.score} /></div><div className="activity-desc" style={{ marginTop: 7 }}>Last practised {topic.lastPracticed.toLowerCase()}</div>
      </div>)}</div></Panel>
      <div className="grid">
        <Panel><PanelHeading title="Next useful actions" caption="Ordered by your current recall" /><div className="panel-pad">{recs.map((rec, index) => <div className="recommendation-card" key={rec.topic}><div className="row space-between"><span className="tag tag-amber">0{index + 1} · PRIORITY</span><ArrowUpRight size={14} color="#8a9990" /></div><div className="recommendation-title">{rec.topic}</div><p className="activity-desc" style={{ lineHeight: 1.5 }}>{rec.reason}</p><Link href="/quiz" className="text-link">{rec.activity} <ArrowRight size={12} /></Link></div>)}</div></Panel>
        <Panel className="panel-pad"><div className="row" style={{ gap: 9 }}><Lightbulb size={16} color="#a77a2b" /><div className="section-label">How this score works</div></div><p style={{ fontSize: 10, lineHeight: 1.7, color: "#7e8981", margin: "10px 0 0" }}>Topic mastery is an on-device estimate, not a grade. Each practice result blends into a starting score. Recommendations sort topics by lowest recall; they do not use a remote model.</p><div className="divider" /><Link className="text-link" href="/evaluation">See practice outcomes <ArrowRight size={12} /></Link></Panel>
      </div>
    </div>
  </>;
}

function EvaluationPage() {
  const { data } = useModel();
  const grouped = new Map<string, { correct: number; total: number; latest: string }>();
  for (const attempt of data.attempts) {
    const existing = grouped.get(attempt.topic) || { correct: 0, total: 0, latest: attempt.completedAt };
    existing.correct += attempt.correct;
    existing.total += attempt.total;
    if (attempt.completedAt > existing.latest) existing.latest = attempt.completedAt;
    grouped.set(attempt.topic, existing);
  }
  const topicRows = data.mastery.map((mastery) => {
    const item = grouped.get(mastery.topic);
    return { ...mastery, correct: item?.correct || 0, total: item?.total || 0 };
  });
  const total = data.attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const correct = data.attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
  const score = total ? Math.round(correct / total * 100) : 0;
  const recs = recommendations(data.mastery);
  return <>
    <PageHeading eyebrow="REFLECT · ADJUST · REPEAT" title="Evaluation" subtitle="Assessment outcomes and adaptive next steps from practice saved in this browser." action={<Link href="/mock-test" className="button button-primary"><Play size={14} />Take a mock test</Link>} />
    <div className="grid grid-three" style={{ marginBottom: 17 }}>
      <TinyStat label="QUESTIONS ANSWERED" value={String(total)} hint={`${data.attempts.length} topic-level results`} icon={ListChecks} />
      <TinyStat label="OVERALL ACCURACY" value={total ? `${score}%` : "—"} hint="Across all saved answers" icon={Target} />
      <TinyStat label="STUDY SESSIONS" value={String(data.attempts.length ? new Set(data.attempts.map((item) => item.completedAt)).size : 0)} hint="Quick practice and mock tests" icon={Activity} />
    </div>
    {!data.attempts.length ? <Panel className="empty-state" style={{ padding: 43 }}><div className="empty-mark"><Activity size={18} /></div><strong>Your first assessment is one short set away.</strong><span>Results will show topic-by-topic accuracy and adapt your recommendations.</span><Link className="button button-primary" href="/quiz" style={{ marginTop: 16 }}>Start quick practice <ArrowRight size={14} /></Link></Panel> :
      <div className="grid grid-two">
        <Panel><PanelHeading title="Outcomes by topic" caption="Answers across your completed practice" /><div className="evaluation-table">
          <div className="table-head"><span>TOPIC</span><span>ACCURACY</span><span>ATTEMPTS</span><span>MASTERY</span></div>
          {topicRows.map((item) => <div className="table-row" key={item.topic}><div><div className="activity-name">{item.topic}</div><div className="activity-desc">{item.lastPracticed}</div></div><div className="evaluation-score">{item.total ? `${Math.round(item.correct / item.total * 100)}%` : "—"}</div><div className="evaluation-score">{item.total}</div><div className="evaluation-score">{item.score}%</div></div>)}
        </div></Panel>
        <div className="grid">
          <Panel><PanelHeading title="Adaptive recommendations" caption="Weak topics move to the top" /><div className="panel-pad">{recs.map((rec) => <div className="eval-recommendation" key={rec.topic}><div className="row space-between"><div className="section-label">{rec.topic}</div><span className="tag tag-coral">REVISIT</span></div><p className="activity-desc" style={{ lineHeight: 1.55 }}>{rec.reason}</p><Link className="text-link" href="/quiz">Practice this topic <ArrowRight size={12} /></Link></div>)}</div></Panel>
          <Panel className="panel-pad"><div className="row space-between"><div><div className="eyebrow" style={{ marginBottom: 5 }}>SCORE ACROSS PRACTICE</div><div className="stat-value" style={{ fontSize: 31 }}>{score}%</div></div><div className="activity-icon"><Activity size={17} /></div></div><div className="bar-chart">{data.attempts.slice(-8).map((attempt, index) => <div className="bar-col" key={attempt.id}><div className={`bar ${index === Math.min(data.attempts.length, 8) - 1 ? "current" : ""}`} style={{ transform: `scaleY(${Math.max(5, attempt.correct / Math.max(1, attempt.total) * 100) / 100})` }} title={`${attempt.topic}: ${attempt.correct}/${attempt.total}`} /><span className="bar-label">{attempt.topic.split(" ")[0]}</span></div>)}</div><div className="panel-caption" style={{ marginTop: 8 }}>Recent topic results · local history only</div></Panel>
        </div>
      </div>}
    <div className="capability-note" style={{ marginTop: 18 }}><ShieldCheck size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />These are practice indicators, not a formal grade or prediction. No assessment data leaves this browser.</div>
  </>;
}

function NotFoundPage() {
  return <div className="not-found"><div className="eyebrow">STUDY SPACE</div><h1 className="page-title">That page isn't in your notebook.</h1><p className="page-subtitle">Return to the study overview to choose your next step.</p><Link className="button button-primary" href="/">Back to overview <ArrowRight size={14} /></Link></div>;
}
function App() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><ModelApp /></WouterRouter>;
}
export default App;