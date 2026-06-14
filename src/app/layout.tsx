import type { Metadata, Viewport } from "next";
import { Mitr } from "next/font/google";
import "./globals.css";

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ClassNote - แชร์สรุป ติดตามงานในห้องเรียน",
  description:
    "แพลตฟอร์มแชร์สรุปบทเรียนและติดตามงานสำหรับนักเรียนในห้องเรียนเดียวกัน",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClassNote",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF9E9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${mitr.variable} h-full antialiased`}>
      <body className="min-h-dvh bg-cream text-dark-text md:flex md:min-h-dvh md:items-center md:justify-center md:overflow-auto md:bg-[#2a2926] md:p-6">
        <div className="flex min-h-dvh w-full flex-col overflow-hidden bg-cream md:h-[844px] md:max-h-none md:min-h-0 md:w-[390px] md:flex-none md:rounded-[2.5rem] md:border-4 md:border-outline md:shadow-[10px_10px_0_#000]">
          {children}
        </div>
      </body>
    </html>
  );
}
