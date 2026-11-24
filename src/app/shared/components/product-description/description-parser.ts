/**
 * Turns the free-text product description (typed in admin or pasted from the
 * Excel "Description" column) into structured sections.
 *
 * Writing rules for the client (kept deliberately simple):
 *   - A line in CAPITALS starts a new section            e.g.  "💎 DIAMOND DETAILS:"
 *   - "* Label: value" or "Label: value" is a detail row  e.g.  "* Shape: Round Cut"
 *   - "* text" without a label is a bullet point         e.g.  "* Engraving"
 *   - Anything else is a normal paragraph
 *   - Text before the first CAPITALS line is the introduction
 * Leading emoji are decorative and stripped from titles and paragraphs.
 */

export interface DescriptionRow {
  label: string;
  value: string;
}

export type DescriptionBlock =
  | { type: 'rows'; rows: DescriptionRow[] }
  | { type: 'list'; items: string[] }
  | { type: 'p'; text: string; label?: string }
  | { type: 'sub'; text: string };

export interface DescriptionSection {
  title: string;
  /** Lower-case, letters only — used for matching (e.g. hiding a section). */
  key: string;
  blocks: DescriptionBlock[];
}

export interface ParsedDescription {
  intro: string[];
  sections: DescriptionSection[];
}

/** Label/value rows longer than this read better as a sentence. */
const MAX_ROW_VALUE = 70;
const MAX_LABEL = 40;

const LEADING_DECOR = /^[^\p{L}\p{N}"'(]+/u;
const BULLET = /^\s*[*•\-–]\s*/;

function stripDecor(text: string): string {
  return text.replace(LEADING_DECOR, '').trim();
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isHeading(raw: string): boolean {
  if (BULLET.test(raw)) return false;
  const text = stripDecor(raw).replace(/:\s*$/, '');
  if (text.includes(':')) return false;
  const letters = text.replace(/[^\p{L}]/gu, '');
  if (letters.length < 3 || text.length > 60) return false;
  return letters === letters.toUpperCase();
}

function splitLabel(text: string): DescriptionRow | null {
  const idx = text.indexOf(':');
  if (idx <= 0) return null;
  const label = text.slice(0, idx).trim();
  const value = text.slice(idx + 1).trim();
  if (!value || label.length > MAX_LABEL || !/^\p{L}/u.test(label)) return null;
  return { label, value };
}

export function parseDescription(source: string | null | undefined): ParsedDescription {
  const result: ParsedDescription = { intro: [], sections: [] };
  if (!source?.trim()) return result;

  let section: DescriptionSection | null = null;
  let paragraph: string[] = [];

  const blocks = (): DescriptionBlock[] | null => section?.blocks ?? null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ');
    paragraph = [];
    const target = blocks();
    if (target) target.push({ type: 'p', text });
    else result.intro.push(text);
  };

  const push = (block: DescriptionBlock) => {
    flushParagraph();
    if (!section) {
      // Structured lines before any heading: open an untitled section.
      section = { title: '', key: '', blocks: [] };
      result.sections.push(section);
    }
    const list = section.blocks;
    const last = list[list.length - 1];
    if (block.type === 'rows' && last?.type === 'rows') {
      last.rows.push(...block.rows);
    } else if (block.type === 'list' && last?.type === 'list') {
      last.items.push(...block.items);
    } else {
      list.push(block);
    }
  };

  for (const rawLine of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    if (isHeading(line)) {
      flushParagraph();
      const title = stripDecor(line).replace(/:\s*$/, '').trim();
      section = { title, key: normalize(title), blocks: [] };
      result.sections.push(section);
      continue;
    }

    const bullet = BULLET.test(line);
    const text = bullet ? line.replace(BULLET, '').trim() : stripDecor(line);
    if (!text) continue;

    // "Diamond Details:" directly under "DIAMOND DETAILS" — a duplicate title, drop it.
    if (!bullet && /:\s*$/.test(text)) {
      const sub = text.replace(/:\s*$/, '').trim();
      const current = section as DescriptionSection | null;
      if (current && normalize(sub) === current.key) continue;
      push({ type: 'sub', text: sub });
      continue;
    }

    const row = splitLabel(text);
    if (row) {
      if (row.value.length <= MAX_ROW_VALUE) push({ type: 'rows', rows: [row] });
      else push({ type: 'p', label: row.label, text: row.value });
      continue;
    }

    if (bullet) {
      push({ type: 'list', items: [text] });
      continue;
    }

    paragraph.push(text);
  }
  flushParagraph();

  // Drop sections that ended up empty (e.g. a heading with nothing under it).
  result.sections = result.sections.filter(s => s.blocks.length);
  return result;
}

/** Every label used in detail rows — lets the page skip specs the description already lists. */
export function descriptionLabels(parsed: ParsedDescription): Set<string> {
  const labels = new Set<string>();
  for (const s of parsed.sections) {
    for (const b of s.blocks) {
      if (b.type === 'rows') b.rows.forEach(r => labels.add(normalize(r.label)));
      if (b.type === 'p' && b.label) labels.add(normalize(b.label));
    }
  }
  return labels;
}

export { normalize as normalizeLabel };
