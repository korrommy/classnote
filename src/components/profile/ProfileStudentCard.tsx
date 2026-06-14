export type ProfileCardTheme = "sunny" | "classic" | "mint";

// ชุดธีมที่อนุญาต — ใช้ validate ค่าที่อ่าน/บันทึกทั้งฝั่ง page และ server action
export const CARD_THEMES = ["classic", "sunny", "mint"] as const;

const themes = {
  sunny: {
    header: "#f7b7d8",
    body: "linear-gradient(180deg, #fff6a8 0%, #ffef91 55%, #f7dda1 100%)",
    avatar: "#77c7df",
    bar: "#ff8848",
    barText: "#080808",
  },
  classic: {
    header: "#fbffc4",
    body: "linear-gradient(180deg, #c7f1f6 0%, #bbe8f2 52%, #9fbdeb 100%)",
    avatar: "#f5a0cf",
    bar: "#2fb673",
    barText: "#080808",
  },
  mint: {
    header: "#ff9a54",
    body: "linear-gradient(180deg, #aaf4d0 0%, #9be9bb 52%, #7edca9 100%)",
    avatar: "#75bdd8",
    bar: "#f3a3cf",
    barText: "#080808",
  },
} satisfies Record<
  ProfileCardTheme,
  {
    header: string;
    body: string;
    avatar: string;
    bar: string;
    barText: string;
  }
>;

export function ProfileStudentCard({
  fullName,
  avatarUrl,
  gradeLevel,
  studentNo,
  theme = "classic",
}: {
  fullName: string;
  avatarUrl: string | null;
  gradeLevel: string | null;
  studentNo: string | null;
  theme?: ProfileCardTheme;
}) {
  const colors = themes[theme];
  const displayName = fullName || "ชื่อ user";
  const gradeText = gradeLevel?.trim() ? gradeLevel : "-";
  const studentNoText = studentNo?.trim() ? studentNo : "-";

  return (
    <section
      className="relative h-[202px] w-full overflow-hidden rounded-[1.25rem] border-2 border-outline"
      style={{ background: colors.body }}
    >
      <div
        className="flex h-[46px] items-center justify-center border-b-2 border-outline"
        style={{ backgroundColor: colors.header }}
      >
        <p className="font-serif text-[22px] font-normal leading-none text-[#f4a1ce] [text-shadow:1px_0_#080808,-1px_0_#080808,0_1px_#080808,0_-1px_#080808]">
          STUDENT ID CARD
        </p>
      </div>

      <div
        aria-label={displayName}
        className="absolute left-[18px] top-[70px] h-[102px] w-[88px] bg-cover bg-center"
        style={{
          backgroundColor: colors.avatar,
          ...(avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}),
        }}
      />

      <div className="absolute left-[124px] top-[80px] font-serif text-[19px] font-normal leading-none text-outline">
        Name
      </div>

      <div className="absolute left-[124px] top-[113px] max-w-[156px] truncate font-sans text-[24px] font-normal leading-none text-outline">
        {displayName}
      </div>

      <div
        className="absolute left-[124px] right-[12px] top-[145px] flex h-[28px] items-center justify-between gap-[6px] px-[10px] font-serif font-normal leading-none"
        style={{ backgroundColor: colors.bar, color: colors.barText }}
      >
        <span className="flex items-baseline gap-[4px]">
          <span className="text-[15px]">Grade</span>
          <span className="whitespace-nowrap text-[14px]" title={gradeText}>
            {gradeText}
          </span>
        </span>
        <span className="flex flex-none items-baseline gap-[4px]">
          <span className="text-[15px]">No.</span>
          <span className="whitespace-nowrap text-[14px]">{studentNoText}</span>
        </span>
      </div>

      <div
        aria-label="5 stars"
        className="absolute bottom-[5px] right-[28px] flex gap-[5px] text-[18px] leading-none text-[#242424]"
      >
        <span>★</span>
        <span>★</span>
        <span>★</span>
        <span>★</span>
        <span className="text-[#3e3e3e]">★</span>
      </div>
    </section>
  );
}
