// รายชื่อห้องเรียนแบบ static สำหรับ dropdown ตอน "สมัครสมาชิก"
// ผู้ใช้ยังไม่ login ตอนสมัคร จึงอ่านตาราง classrooms (RLS = login-only) ไม่ได้
// จึง hardcode จาก fixed UUID ที่ seed ไว้ใน migrations (0009/0010)
// เมื่อเพิ่มห้องใหม่ในอนาคต ให้เพิ่มที่นี่ด้วย
export type ClassroomChoice = { id: string; name: string };

export const CLASSROOMS: ClassroomChoice[] = [
  { id: "c0000000-0000-4000-8000-000000000501", name: "ม.5/1" },
  { id: "c0000000-0000-4000-8000-000000000601", name: "ม.6/1" },
];

export function isKnownClassroomId(id: string): boolean {
  return CLASSROOMS.some((c) => c.id === id);
}
