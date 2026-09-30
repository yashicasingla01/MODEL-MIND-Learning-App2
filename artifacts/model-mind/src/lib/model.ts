export type SourceType = "PDF" | "PPTX" | "Transcript" | "Video" | "Text";
export type Source = {
  id: string;
  name: string;
  type: SourceType;
  pagesOrSlides: number;
  extractedText: string;
  addedAt: string;
  demo?: boolean;
};
export type Citation = {
  sourceId: string;
  sourceName: string;
  location: string;
  label: string;
  text: string;
};
export type TutorTurn = {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  grounded: boolean;
  at: string;
};
export type QuizQuestion = {
  id: string;
  topic: string;
  type: "Multiple choice" | "Short answer" | "Numerical";
  prompt: string;
  choices: string[];
  answer: string;
  graderTerms: string[];
  explanation: string;
  citation: Citation;
};
export type QuestionMode = "multiple-choice" | "short-answer" | "numerical" | "mixed";
export type Attempt = {
  id: string;
  topic: string;
  correct: number;
  total: number;
  completedAt: string;
};
export type Mastery = {
  topic: string;
  score: number;
  attempts: number;
  lastPracticed: string;
};
export type Recommendation = { topic: string; activity: string; reason: string };

const demoText = `CELL STRUCTURE
PAGE 1
All living organisms are composed of one or more cells. The cell is the basic structural and functional unit of life.
Prokaryotic cells lack a membrane-bound nucleus, while eukaryotic cells contain a nucleus enclosed by a membrane.
The plasma membrane is a selectively permeable barrier that regulates what enters and leaves the cell.
Ribosomes are the sites of protein synthesis and are found in both prokaryotic and eukaryotic cells.

MEMBRANES AND TRANSPORT
PAGE 3
The phospholipid bilayer forms the basic structure of the plasma membrane. Each phospholipid has a hydrophilic head and two hydrophobic tails.
Diffusion is the net movement of particles from an area of higher concentration to an area of lower concentration.
Osmosis is the diffusion of water across a selectively permeable membrane.
Active transport moves substances against their concentration gradient and requires energy, often from ATP.

ENERGY AND PHOTOSYNTHESIS
PAGE 5
Photosynthesis converts light energy into chemical energy stored in glucose. It takes place in chloroplasts.
Chlorophyll absorbs light energy, especially wavelengths in the blue and red regions of the spectrum.
The overall photosynthesis equation uses carbon dioxide and water to produce glucose and oxygen in the presence of light.
Cellular respiration releases energy from glucose to make ATP. In eukaryotic cells, most stages of aerobic respiration occur in mitochondria.

GENETICS
PAGE 8
DNA stores hereditary information in the sequence of its nucleotide bases.
During transcription, a segment of DNA is used as a template to produce messenger RNA.
During translation, ribosomes read messenger RNA codons to assemble a chain of amino acids.
An allele is a version of a gene. An organism inherits alleles from its parents.
In diploid human somatic cells, there are 46 chromosomes arranged in 23 pairs.

ECOLOGY
PAGE 10
An ecosystem includes a community of organisms and the non-living environment with which they interact.
Producers make organic molecules, usually using energy from sunlight, and form the base of many food webs.
Energy flows through an ecosystem, while matter is recycled between organisms and the environment.`;

export const DEMO_SOURCE_ID = "sample-cell-biology";
export const SEED_SOURCE: Source = {
  id: DEMO_SOURCE_ID,
  name: "Introductory Biology · course reader (sample)",
  type: "PDF",
  pagesOrSlides: 12,
  extractedText: demoText,
  addedAt: "2025-03-04T09:00:00.000Z",
  demo: true,
};

export const initialMastery: Mastery[] = [
  { topic: "Cell structure", score: 76, attempts: 4, lastPracticed: "Yesterday" },
  { topic: "Membranes & transport", score: 48, attempts: 3, lastPracticed: "3 days ago" },
  { topic: "Photosynthesis", score: 62, attempts: 2, lastPracticed: "4 days ago" },
  { topic: "Genetics", score: 81, attempts: 5, lastPracticed: "Yesterday" },
  { topic: "Ecology", score: 35, attempts: 2, lastPracticed: "6 days ago" },
];

const seedKey = "modelmind:v1";
export type StoredData = {
  sources: Source[];
  turns: TutorTurn[];
  attempts: Attempt[];
  mastery: Mastery[];
};

export function readStoredData(): StoredData {
  try {
    const raw = localStorage.getItem(seedKey);
    if (raw) {
      const value = JSON.parse(raw) as Partial<StoredData>;
      return {
        sources: Array.isArray(value.sources)
          ? value.sources.map((source) => source?.id === DEMO_SOURCE_ID ? SEED_SOURCE : source)
          : [SEED_SOURCE],
        turns: Array.isArray(value.turns) ? value.turns : [],
        attempts: Array.isArray(value.attempts) ? value.attempts : [],
        mastery: Array.isArray(value.mastery) ? value.mastery : initialMastery,
      };
    }
  } catch {
    // A corrupt or unavailable local store falls back to the demonstration course.
  }
  return { sources: [SEED_SOURCE], turns: [], attempts: [], mastery: initialMastery };
}

export function saveStoredData(data: StoredData) {
  try {
    localStorage.setItem(seedKey, JSON.stringify(data));
  } catch {
    // Keep the current session usable when browser storage is full or unavailable.
  }
}

export function sentenceRows(source: Source): { text: string; location: string; label: string }[] {
  const lines = source.extractedText.split("\n");
  let paragraph = 0;
  let slideNumber = 1;
  let pageNumber = 1;
  let offset = 0;
  return lines.flatMap((rawLine, lineIndex) => {
    const lineStart = offset;
    offset += rawLine.length + 1;
    const line = rawLine.trim();
    if (!line) return [];
    const slideHeading = line.match(/^SLIDE\s+(\d+)/i);
    if (slideHeading) {
      slideNumber = Number(slideHeading[1]);
      return [];
    }
    const pageHeading = line.match(/^PAGE\s+(\d+)/i);
    if (pageHeading) {
      pageNumber = Number(pageHeading[1]);
      return [];
    }
    if (/^[A-Z][A-Z &-]{2,}$/.test(line)) {
      paragraph += 1;
      return [];
    }
    const units = line.match(/[^.!?]+[.!?]?/g) || [line];
    let searchAt = 0;
    return units.flatMap((part, index) => {
      const text = part.trim();
      const relative = rawLine.indexOf(text, searchAt);
      searchAt = Math.max(searchAt, relative + text.length);
      if (text.length <= 28) return [];
      const characterStart = lineStart + Math.max(relative, 0);
      const location = source.type === "Transcript" || source.type === "Video"
        ? `Transcript · ${text.match(/\b\d{1,2}:\d{2}\b/)?.[0] || `segment ${paragraph + index + 1}`}`
        : source.type === "PPTX"
          ? `Slide ${slideNumber}`
          : source.type === "PDF"
            ? `Page ${pageNumber}`
            : `Text · line ${lineIndex + 1}`;
      return [{ text, location, label: `Excerpt ${paragraph + index + 1}` }];
    });
  });
}

export function topicFor(text: string): string {
  const s = text.toLowerCase();
  if (/photosynth|chlorophyll|chloroplast|light energy/.test(s)) return "Photosynthesis";
  if (/diffusion|osmosis|membrane|phospholipid|transport|concentration gradient/.test(s)) return "Membranes & transport";
  if (/dna|allele|gene|genetic|transcription|translation|rna|codon/.test(s)) return "Genetics";
  if (/ecosystem|producer|food web|organism|ecology|energy flows/.test(s)) return "Ecology";
  return "Cell structure";
}

const stopwords = new Set(["what", "when", "where", "which", "does", "have", "with", "from", "that", "this", "into", "about", "explain", "tell", "please", "could", "would", "your", "course", "material", "materials", "how", "why", "are", "the", "and", "for", "can", "use", "used", "mean", "means"]);
export function findEvidence(question: string, sources: Source[]): Citation[] {
  const terms = question.toLowerCase().match(/[a-z0-9-]{3,}/g)?.filter((word) => !stopwords.has(word)) || [];
  if (!terms.length) return [];
  const hits: { citation: Citation; score: number }[] = [];
  for (const source of sources) {
    for (const row of sentenceRows(source)) {
      const text = row.text.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (text.includes(term) ? (term.length > 6 ? 2 : 1) : 0), 0);
      if (score > 0) {
        hits.push({
          citation: { sourceId: source.id, sourceName: source.name, location: row.location, label: row.label, text: row.text },
          score,
        });
      }
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 3).map((hit) => hit.citation);
}

export function makeQuizQuestions(
  sources: Source[],
  amount = 5,
  preferredTopic?: string,
  mode: QuestionMode = "multiple-choice",
): QuizQuestion[] {
  const all = sources.flatMap((source) => sentenceRows(source).map((row) => ({
    source,
    row,
    topic: topicFor(row.text),
  })));
  if (!all.length) return [];
  const questions: QuizQuestion[] = [];
  const sourceOrder = [...all].sort((a, b) => {
    const preferredA = a.topic === preferredTopic ? 0 : 1;
    const preferredB = b.topic === preferredTopic ? 0 : 1;
    if (preferredA !== preferredB) return preferredA - preferredB;
    const aScore = a.source.demo ? 1 : 0;
    const bScore = b.source.demo ? 1 : 0;
    return aScore - bScore;
  });
  const preferredRows = preferredTopic ? sourceOrder.filter((item) => item.topic === preferredTopic) : [];
  const numericRows = sourceOrder.filter((item) => /\b\d+(?:\.\d+)?\b/.test(item.row.text));
  const stopTerms = new Set([
    "about", "across", "after", "among", "because", "before", "between", "could",
    "during", "from", "into", "most", "often", "other", "over", "should", "their",
    "there", "these", "those", "through", "under", "using", "which", "while", "would",
    "with", "within", "without", "where", "when", "what", "this", "that", "they",
    "them", "then", "than", "have", "has", "were", "been", "being", "will", "also",
    "each", "both", "such", "some", "many", "more", "less", "very", "much", "does",
    "from", "into", "over", "onto", "near", "make", "made", "forms", "form", "uses",
    "used", "found", "takes", "take", "most", "often", "area", "areas", "basic",
    "major", "main", "part", "parts", "number", "numbers", "system", "process",
  ]);
  const availableModes = mode === "mixed"
    ? numericRows.length ? ["multiple-choice", "short-answer", "numerical"] as const : ["multiple-choice", "short-answer"] as const
    : [mode] as const;

  for (let i = 0; i < Math.min(amount, sourceOrder.length); i += 1) {
    const questionMode = availableModes[i % availableModes.length];
    const pool = questionMode === "numerical" ? numericRows : preferredRows.length ? preferredRows : sourceOrder;
    const chosen = pool[(i * 3 + Math.floor(i / 3)) % pool.length];
    let prompt = "";
    let answer = "";
    let graderTerms: string[] = [];
    let choices: string[] = [];
    let type: QuizQuestion["type"] = "Multiple choice";

    if (questionMode === "numerical") {
      type = "Numerical";
      const match = chosen.row.text.match(/\b\d+(?:\.\d+)?\b/);
      if (!match) continue;
      answer = match[0];
      prompt = chosen.row.text.replace(match[0], "_____");
    } else if (questionMode === "short-answer") {
      type = "Short answer";
      const definition = chosen.row.text.match(/^([^,.]{2,70}?)\s+(?:is|are|means|refers to)\s+/i);
      const subject = definition?.[1].trim() || chosen.topic;
      prompt = definition
        ? `In your own words, what does the source say about ${subject}?`
        : `In your own words, state the main idea in this course excerpt.`;
      answer = chosen.row.text;
      graderTerms = [...new Set(
        (chosen.row.text.toLowerCase().match(/[a-z][a-z-]{4,}/g) || [])
          .filter((word) => !stopTerms.has(word) && word !== subject.toLowerCase())
      )].slice(0, 3);
      if (!graderTerms.length) graderTerms = [chosen.topic.toLowerCase().split(" ")[0]];
    } else {
      type = "Multiple choice";
      const words = chosen.row.text.match(/[A-Za-z][A-Za-z-]{4,}/g) || [];
      const answerWord = [...words].sort((a, b) => b.length - a.length)[i % Math.min(3, words.length)];
      if (!answerWord) continue;
      answer = answerWord;
      prompt = chosen.row.text.replace(new RegExp(`\\b${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"), "_____");
      const distractors = [...new Map(all
        .flatMap((item) => item.row.text.match(/[A-Za-z][A-Za-z-]{4,}/g) || [])
        .filter((word) => word.toLowerCase() !== answer.toLowerCase() && !prompt.toLowerCase().includes(word.toLowerCase()))
        .map((word) => [word.toLowerCase(), word])).values()];
      choices = [answer, ...distractors.slice(i * 4, i * 4 + 3)];
      const fallbacks = ["organism", "chemical", "sequence", "molecule", "process", "energy"];
      for (const fallback of fallbacks) {
        if (choices.length >= 4) break;
        if (!choices.some((choice) => choice.toLowerCase() === fallback.toLowerCase())) choices.push(fallback);
      }
      choices = choices.slice(0, 4).sort((a, b) => (a.toLowerCase().charCodeAt(0) + i) % 2 ? -1 : 1);
    }
    const citation: Citation = {
      sourceId: chosen.source.id,
      sourceName: chosen.source.name,
      location: chosen.row.location,
      label: chosen.row.label,
      text: chosen.row.text,
    };
    questions.push({
      id: `q-${chosen.source.id}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      topic: chosen.topic,
      type,
      prompt,
      choices,
      answer,
      graderTerms,
      explanation: chosen.row.text,
      citation,
    });
  }
  return questions;
}

export function isAnswerCorrect(question: QuizQuestion, answer: string): boolean {
  if (question.type === "Multiple choice") {
    return answer.trim().toLocaleLowerCase() === question.answer.trim().toLocaleLowerCase();
  }
  if (question.type === "Numerical") {
    const entered = Number(answer.trim().replace(/,/g, ""));
    const expected = Number(question.answer);
    return Number.isFinite(entered) && entered === expected;
  }
  const normalized = answer.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const matchingTerms = question.graderTerms.filter((term) => normalized.includes(term.toLowerCase())).length;
  return answer.trim().length >= 12 && matchingTerms >= Math.min(2, question.graderTerms.length);
}