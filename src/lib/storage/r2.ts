import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 พูดภาษา S3 ได้ จึงใช้ AWS SDK ตัวเดิมต่อกับ R2 endpoint
// ตัวแปรลับทั้งหมดอยู่ฝั่ง server เท่านั้น (ไฟล์นี้ import "server-only")
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET = process.env.R2_BUCKET ?? "";

// บอกได้ตั้งแต่ต้นว่า env ครบหรือยัง เพื่อ fallback ได้อย่างปลอดภัย
export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && R2_BUCKET,
);

// สร้าง client ครั้งเดียว (reuse ได้) — region "auto" ตามที่ R2 กำหนด
const client = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    })
  : null;

// อัปโหลดไฟล์ขึ้น R2 — รับ File จาก FormData (อยู่ฝั่ง server แล้ว)
// คืน true เมื่อสำเร็จ เพื่อให้ caller ตัดสินใจว่าจะบันทึก metadata หรือไม่
export async function uploadToR2(
  key: string,
  file: File,
  contentType: string,
): Promise<boolean> {
  if (!client) return false;
  const buffer = Buffer.from(await file.arrayBuffer());
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return true;
}

// สร้าง presigned GET URL อายุสั้น (default 1 ชม.) สำหรับแสดง/ดาวน์โหลดไฟล์
// bucket เป็น private — ลิงก์นี้หมดอายุเองตามเวลาที่กำหนด
export async function getR2SignedUrl(
  key: string,
  expiresIn = 3600,
): Promise<string | null> {
  if (!client) return null;
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn },
  );
}

// ดึง object จาก R2 มาเป็น bytes (ใช้ใน route พร็อกซีรูป avatar)
// คืน null ถ้า R2 ไม่พร้อม หรือไม่พบไฟล์ (ให้ caller ตอบ 404)
export async function getR2Object(
  key: string,
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!client) return null;
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    );
    if (!res.Body) return null;
    const body = await res.Body.transformToByteArray();
    return {
      body,
      contentType: res.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

// ลบทุก object ภายใต้ prefix (เช่น "<noteId>/") เมื่อโน้ตถูกลบ
export async function deleteR2Prefix(prefix: string): Promise<void> {
  if (!client) return;
  const listed = await client.send(
    new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: prefix }),
  );
  const objects = listed.Contents ?? [];
  if (objects.length === 0) return;
  await client.send(
    new DeleteObjectsCommand({
      Bucket: R2_BUCKET,
      Delete: {
        Objects: objects
          .filter((object) => object.Key)
          .map((object) => ({ Key: object.Key! })),
      },
    }),
  );
}
