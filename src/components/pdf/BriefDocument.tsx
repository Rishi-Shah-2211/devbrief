import {
  Circle,
  Document,
  Page,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type { RepoAnalytics } from "@/orchestrator/types";
import { parseMarkdown, type Block, type Span } from "./markdown";

/** Brand palette, mirrored from globals.css so the PDF reads as the same product. */
const C = {
  canvas: "#faf8f6",
  surface: "#f3f0ee",
  hairline: "#e7e1dd",
  ink: "#161214",
  muted: "#585056",
  faint: "#978f95",
  wine: "#6e2746",
  gold: "#ad8754",
  done: "#3f7d5a",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.canvas,
    color: C.ink,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    lineHeight: 1.55,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: C.faint,
  },
  wordmark: { fontFamily: "Times-Roman", fontSize: 14, color: C.wine },
  h1: { fontFamily: "Times-Roman", fontSize: 26, marginBottom: 6 },
  h2: {
    fontFamily: "Times-Roman",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },
  h3: { fontSize: 11, marginTop: 10, marginBottom: 4, color: C.ink },
  para: { marginBottom: 6, color: C.muted },
  bold: { color: C.ink },
  code: { fontFamily: "Courier", fontSize: 9, color: C.wine },
  codeBlock: {
    fontFamily: "Courier",
    fontSize: 8.5,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.hairline,
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    color: C.ink,
  },
  listRow: { flexDirection: "row", marginBottom: 3, paddingLeft: 6 },
  listMarker: { width: 16, color: C.gold },
  listText: { flex: 1, color: C.muted },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.hairline },
  tableCell: { flex: 1, padding: 5, fontSize: 9, color: C.muted },
  tableHeadCell: { flex: 1, padding: 5, fontSize: 9, color: C.ink, fontFamily: "Helvetica-Bold" },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: C.hairline,
    borderRadius: 6,
    padding: 14,
  },
  statLabel: { fontSize: 8, color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontFamily: "Times-Roman", fontSize: 22, color: C.wine, marginTop: 2 },
});

function Footer({ repo }: { repo: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>DevBrief — {repo}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

/** Health score as a donut gauge. */
function HealthDonut({ score }: { score: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  return (
    <Svg width={92} height={92} viewBox="0 0 92 92">
      <Circle cx={46} cy={46} r={r} stroke={C.hairline} strokeWidth={9} fill="none" />
      <Circle
        cx={46}
        cy={46}
        r={r}
        stroke={score >= 70 ? C.done : score >= 40 ? C.gold : C.wine}
        strokeWidth={9}
        fill="none"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 46 46)"
      />
      <Text x={46} y={51} textAnchor="middle" style={{ fontFamily: "Times-Roman", fontSize: 20, color: C.ink }}>
        {String(score)}
      </Text>
    </Svg>
  );
}

/** Horizontal bar chart used for languages and directories. */
function Bars({ data, unit }: { data: { label: string; value: number; note?: string }[]; unit: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View>
      {data.map((d) => (
        <View key={d.label} style={{ marginBottom: 7 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
            <Text style={{ fontSize: 9, color: C.ink }}>{d.label}</Text>
            <Text style={{ fontSize: 8, color: C.faint }}>
              {d.note ?? `${d.value} ${unit}`}
            </Text>
          </View>
          <Svg width={430} height={7} viewBox="0 0 430 7">
            <Rect x={0} y={0} width={430} height={7} rx={3.5} fill={C.surface} />
            <Rect x={0} y={0} width={Math.max((d.value / max) * 430, 6)} height={7} rx={3.5} fill={C.wine} />
          </Svg>
        </View>
      ))}
    </View>
  );
}

function InlineSpans({ spans }: { spans: Span[] }) {
  return (
    <Text style={s.para}>
      {spans.map((sp, i) =>
        sp.code ? (
          <Text key={i} style={s.code}>{sp.text}</Text>
        ) : sp.bold ? (
          <Text key={i} style={[s.bold, { fontFamily: "Helvetica-Bold" }]}>{sp.text}</Text>
        ) : (
          <Text key={i}>{sp.text}</Text>
        ),
      )}
    </Text>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "heading":
      return <Text style={block.level === 1 ? s.h1 : block.level === 2 ? s.h2 : s.h3}>{block.text}</Text>;
    case "para":
      return <InlineSpans spans={block.spans} />;
    case "code":
      return <Text style={s.codeBlock}>{block.text}</Text>;
    case "list":
      return (
        <View style={{ marginBottom: 6 }}>
          {block.items.map((item, i) => (
            <View key={i} style={s.listRow}>
              <Text style={s.listMarker}>{block.ordered ? `${i + 1}.` : "•"}</Text>
              <Text style={s.listText}>
                {item.map((sp, j) =>
                  sp.code ? (
                    <Text key={j} style={s.code}>{sp.text}</Text>
                  ) : sp.bold ? (
                    <Text key={j} style={{ fontFamily: "Helvetica-Bold", color: C.ink }}>{sp.text}</Text>
                  ) : (
                    <Text key={j}>{sp.text}</Text>
                  ),
                )}
              </Text>
            </View>
          ))}
        </View>
      );
    case "table":
      return (
        <View style={{ marginBottom: 8, borderWidth: 1, borderColor: C.hairline, borderRadius: 4 }}>
          <View style={[s.tableRow, { backgroundColor: C.surface }]}>
            {block.header.map((h, i) => (
              <Text key={i} style={s.tableHeadCell}>{h.replace(/`/g, "")}</Text>
            ))}
          </View>
          {block.rows.map((row, i) => (
            <View key={i} style={s.tableRow}>
              {row.map((cell, j) => (
                <Text key={j} style={s.tableCell}>{cell.replace(/`|\*\*/g, "")}</Text>
              ))}
            </View>
          ))}
        </View>
      );
  }
}

export interface BriefPdfProps {
  repo: string;
  description: string | null;
  brief: string;
  analytics: RepoAnalytics;
  generatedAt: string;
}

const SIGNAL_LABELS: [keyof RepoAnalytics["signals"], string][] = [
  ["readme", "README"],
  ["license", "License"],
  ["tests", "Test suite"],
  ["ci", "CI workflows"],
  ["docs", "Docs folder"],
  ["contributing", "Contributing guide"],
];

export function BriefDocument({ repo, description, brief, analytics, generatedAt }: BriefPdfProps) {
  const blocks = parseMarkdown(brief).filter((b) => !(b.kind === "heading" && b.level === 1));

  return (
    <Document title={`DevBrief — ${repo}`} author="DevBrief">
      {/* ——— Cover + analytics ——— */}
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 28 }}>
          <Text style={s.wordmark}>DevBrief</Text>
          <Text style={{ fontSize: 8, color: C.faint }}>{generatedAt}</Text>
        </View>

        <Text style={{ fontSize: 9, color: C.gold, letterSpacing: 1.5, marginBottom: 6 }}>
          ONBOARDING BRIEF
        </Text>
        <Text style={s.h1}>{repo}</Text>
        {description ? <Text style={{ color: C.muted, marginBottom: 18 }}>{description}</Text> : null}

        {/* Stat row */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 14 }}>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.statLabel}>Files</Text>
            <Text style={s.statValue}>{analytics.totalFiles.toLocaleString()}</Text>
          </View>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.statLabel}>Tree depth</Text>
            <Text style={s.statValue}>{analytics.maxDepth}</Text>
          </View>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.statLabel}>Dependencies</Text>
            <Text style={s.statValue}>{analytics.dependencyCount ?? "—"}</Text>
          </View>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.statLabel}>Onboarding</Text>
            <Text style={[s.statValue, { fontSize: 15, marginTop: 8 }]}>{analytics.onboardingDifficulty}</Text>
          </View>
        </View>

        {/* Health + signals */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <View style={[s.card, { width: 150, alignItems: "center" }]}>
            <Text style={[s.statLabel, { marginBottom: 6 }]}>Repo health</Text>
            <HealthDonut score={analytics.healthScore} />
          </View>
          <View style={[s.card, { flex: 1 }]}>
            <Text style={[s.statLabel, { marginBottom: 8 }]}>Hygiene signals</Text>
            {SIGNAL_LABELS.map(([key, label]) => (
              <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 9, color: C.ink }}>{label}</Text>
                <Text style={{ fontSize: 9, color: analytics.signals[key] ? C.done : C.faint }}>
                  {analytics.signals[key] ? "present" : "missing"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Language chart */}
        <View style={s.card}>
          <Text style={[s.statLabel, { marginBottom: 8 }]}>Language composition</Text>
          <Bars
            data={analytics.languages.map((l) => ({ label: l.name, value: l.files, note: `${l.pct}% · ${l.files} files` }))}
            unit="files"
          />
        </View>

        <Footer repo={repo} />
      </Page>

      {/* ——— Structure page ——— */}
      <Page size="A4" style={s.page}>
        <Text style={s.h2}>Where the code lives</Text>
        <Text style={[s.para, { marginBottom: 10 }]}>
          Largest top-level directories by file count — start your exploration here.
        </Text>
        <View style={s.card}>
          <Bars data={analytics.topDirs.map((d) => ({ label: `${d.name}/`, value: d.files }))} unit="files" />
        </View>

        <Text style={[s.h2, { marginTop: 22 }]}>The brief</Text>
        {blocks.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
        <Footer repo={repo} />
      </Page>
    </Document>
  );
}
