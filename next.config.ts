import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // อัปโหลดไฟล์แนบโน้ตสูงสุด 30MB + เผื่อ multipart overhead/form fields อื่น
      bodySizeLimit: "40mb",
    },
  },
  images: {
    ...(supabaseHostname && {
      remotePatterns: [{ hostname: supabaseHostname }],
    }),
    localPatterns: [
      { pathname: "/logo/**" },
      { pathname: "/subjects/**" },
      { pathname: "/icons/**" },
      { pathname: "/mascot/**" },
      { pathname: "/doodles/**" },
      { pathname: "/banner/**" },
      { pathname: "/illustrations/**" },
      { pathname: "/student-frames/**" },
    ],
  },
};

export default nextConfig;
