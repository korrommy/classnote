export type SubjectBanner = {
  id?: string | null;
  name: string;
  src: string;
  keywords: string[];
};

export const DEFAULT_SUBJECT_BANNERS: SubjectBanner[] = [
  {
    name: "คณิตศาสตร์",
    src: "/subjects/math.png",
    keywords: ["คณิต", "math", "mathematics", "ฟิสิกส์", "physics"],
  },
  {
    name: "ชีววิทยา",
    src: "/subjects/biology.png",
    keywords: ["ชีว", "bio", "biology"],
  },
  {
    name: "เคมี",
    src: "/subjects/chemistry.png",
    keywords: ["เคมี", "chem", "chemistry"],
  },
  {
    name: "ดาราศาสตร์",
    src: "/subjects/astronomy.png",
    keywords: ["ดารา", "astro", "astronomy"],
  },
  {
    name: "ภาษาอังกฤษ",
    src: "/subjects/english.png",
    keywords: ["อังกฤษ", "english"],
  },
  {
    name: "ภาษาไทย",
    src: "/subjects/thai.png",
    keywords: ["ไทย", "thai"],
  },
  {
    name: "สังคมศึกษา",
    src: "/subjects/social.png",
    keywords: ["สังคม", "social"],
  },
  {
    name: "อื่นๆ",
    src: "/subjects/other.png",
    keywords: ["อื่น", "other", "ทั่วไป"],
  },
];

function normalizeSubjectName(name: string | null | undefined) {
  return (name ?? "").trim().toLowerCase();
}

function matchingDefaultBanner(name: string | null | undefined) {
  const lower = normalizeSubjectName(name);
  return DEFAULT_SUBJECT_BANNERS.find((subject) =>
    subject.keywords.some((keyword) => lower.includes(keyword.toLowerCase())),
  );
}

export function subjectImage(name: string | null | undefined): string {
  return matchingDefaultBanner(name)?.src ?? "/subjects/other.png";
}

export function mergedSubjectBanners(
  subjects: { id: string; name: string }[] | null | undefined,
): SubjectBanner[] {
  const databaseBanners = (subjects ?? []).map((subject) => {
    const defaultBanner = matchingDefaultBanner(subject.name);

    return {
      id: subject.id,
      name: subject.name,
      src: defaultBanner?.src ?? "/subjects/other.png",
      keywords: defaultBanner?.keywords ?? [subject.name],
    };
  });

  const matchedDefaults = new Set(
    databaseBanners
      .map((subject) => matchingDefaultBanner(subject.name)?.name)
      .filter(Boolean),
  );

  return [
    ...databaseBanners,
    ...DEFAULT_SUBJECT_BANNERS.filter((subject) => !matchedDefaults.has(subject.name)),
  ];
}
