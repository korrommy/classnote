import type { NoteCoverKind } from "@/lib/notes/cover";

const SUBJECT_COLORS = [
  "bg-tag-blue",
  "bg-pink-accent",
  "bg-tag-purple",
  "bg-soft-yellow",
  "bg-aqua",
];

export function colorForSubject(subjectName: string | null) {
  if (!subjectName) return "bg-tag-blue";
  const seed = [...subjectName].reduce((total, char) => total + char.charCodeAt(0), 0);
  return SUBJECT_COLORS[seed % SUBJECT_COLORS.length];
}

// พื้นที่สี่เหลี่ยมหน้าปก: รูปจริง > placeholder PDF > placeholder อ่อน ๆ
// size = ความกว้าง (px) ของกล่องสี่เหลี่ยมจัตุรัส (ค่าเริ่มต้น 96 = w-24 เดิม)
export function NoteThumb({
  title,
  coverUrl,
  fileKind,
  subjectName,
  size = 96,
}: {
  title: string;
  coverUrl?: string | null;
  fileKind?: NoteCoverKind;
  subjectName: string | null;
  size?: number;
}) {
  const base =
    "aspect-square flex-none overflow-hidden rounded-[0.8rem] border-2 border-outline";
  const sizeStyle = { width: `${size}px` };

  if (coverUrl) {
    return (
      <span
        role="img"
        aria-label={`ภาพปกของ ${title}`}
        className={`${base} bg-cover bg-center`}
        style={{ ...sizeStyle, backgroundImage: `url(${coverUrl})` }}
      />
    );
  }

  // ไม่มีรูปจริง → ทำหน้าปกให้ดูเหมือน "หน้ากระดาษโน้ต": แถบสีหัวตามวิชา +
  // เส้นบรรทัดจาง ๆ บนพื้นกระดาษ (ถ้าเป็น PDF ติดป้าย "PDF" เล็ก ๆ มุมล่าง)
  return (
    <span
      aria-hidden
      className={`${base} relative flex flex-col bg-paper`}
      style={sizeStyle}
    >
      <span className={`h-[15px] w-full border-b border-outline/30 ${colorForSubject(subjectName)}`} />
      <span className="flex flex-1 flex-col justify-center gap-[6px] px-2.5">
        <span className="h-[3px] w-[85%] rounded-full bg-outline/15" />
        <span className="h-[3px] w-[65%] rounded-full bg-outline/15" />
        <span className="h-[3px] w-[90%] rounded-full bg-outline/15" />
        <span className="h-[3px] w-[55%] rounded-full bg-outline/15" />
      </span>
      {fileKind === "pdf" && (
        <span className="absolute bottom-1 right-1 rounded-[0.3rem] border border-outline bg-soft-yellow px-1 py-[1px] text-[8px] font-normal leading-none">
          PDF
        </span>
      )}
    </span>
  );
}
