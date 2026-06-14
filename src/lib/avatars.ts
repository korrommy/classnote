// ค่าคงที่สำหรับรูปโปรไฟล์ (avatar) — ใช้ร่วมทั้งฝั่ง client และ server
// รูปจริงของผู้ใช้เก็บใน R2 (bucket private) แล้วเสิร์ฟผ่าน /api/avatar/<file>
// (route ตรวจ auth ก่อน) จึง render ผ่าน url() ได้ทุกหน้าโดยไม่ต้องเปิด bucket
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

// MIME ที่อนุญาต → นามสกุลไฟล์ (รูปเท่านั้น)
export const AVATAR_MIME: Record<string, { ext: string }> = {
  "image/png": { ext: "png" },
  "image/jpeg": { ext: "jpg" },
  "image/webp": { ext: "webp" },
};

// ใช้กับ <input type="file" accept=...>
export const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp";

export const AVATAR_KEY_PREFIX = "avatars/"; // prefix ของ key ใน R2 bucket
export const AVATAR_URL_PREFIX = "/api/avatar/"; // path ที่เก็บใน profiles.avatar_url

// แปลง R2 key (avatars/<file>) → path ที่เก็บใน avatar_url และ render ได้
export function avatarKeyToUrl(key: string): string {
  return AVATAR_URL_PREFIX + key.slice(AVATAR_KEY_PREFIX.length);
}
