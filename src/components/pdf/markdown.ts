/**
 * A minimal Markdown → block parser for the PDF renderer. Handles the shapes
 * our agents actually produce (headings, paragraphs, lists, code fences,
 * tables, inline bold/code/links) — not the full CommonMark spec.
 */

export interface Span {
  text: string;
  bold?: boolean;
  code?: boolean;
}

export type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "para"; spans: Span[] }
  | { kind: "list"; ordered: boolean; items: Span[][] }
  | { kind: "code"; text: string }
  | { kind: "table"; header: string[]; rows: string[][] };

/** Splits inline markdown into styled spans: **bold**, `code`, [label](url) → label. */
export function parseInline(raw: string): Span[] {
  const cleaned = raw.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  const spans: Span[] = [];
  const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned))) {
    if (m.index > last) spans.push({ text: cleaned.slice(last, m.index) });
    if (m[2] !== undefined) spans.push({ text: m[2], bold: true });
    else if (m[4] !== undefined) spans.push({ text: m[4], code: true });
    last = m.index + m[0].length;
  }
  if (last < cleaned.length) spans.push({ text: cleaned.slice(last) });
  return spans.length > 0 ? spans : [{ text: cleaned }];
}

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

    // Code fence
    if (line.trimStart().startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) buf.push(lines[i++]);
      i++; // closing fence
      blocks.push({ kind: "code", text: buf.join("\n") });
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      blocks.push({
        kind: "heading",
        level: h[1].length as 1 | 2 | 3,
        text: h[2].replace(/\*\*/g, "").trim(),
      });
      i++;
      continue;
    }

    // Table (header row + separator row)
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const cells = (l: string) => l.split("|").map((c) => c.trim()).filter((c, idx, arr) => !(c === "" && (idx === 0 || idx === arr.length - 1)));
      const header = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") rows.push(cells(lines[i++]));
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    // List (bulleted or numbered, consumed as one block)
    const bullet = /^\s*[-*+]\s+(.*)$/;
    const numbered = /^\s*\d+[.)]\s+(.*)$/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const re = ordered ? numbered : bullet;
      const items: Span[][] = [];
      while (i < lines.length) {
        const m = lines[i].match(re);
        if (!m) {
          // continuation line indented under the previous item
          if (items.length > 0 && /^\s{2,}\S/.test(lines[i])) {
            items[items.length - 1].push({ text: " " + lines[i].trim() });
            i++;
            continue;
          }
          break;
        }
        items.push(parseInline(m[1]));
        i++;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    // Paragraph: gather until a blank or structural line
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3})\s/.test(lines[i]) &&
      !bullet.test(lines[i]) &&
      !numbered.test(lines[i]) &&
      !lines[i].trimStart().startsWith("```")
    ) {
      buf.push(lines[i++]);
    }
    blocks.push({ kind: "para", spans: parseInline(buf.join(" ")) });
  }

  return blocks;
}
