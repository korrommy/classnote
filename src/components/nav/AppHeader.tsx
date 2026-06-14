import Image from "next/image";
import Link from "next/link";

// แถบหัวแอป — โลโก้ ClassNote อยู่บนสุด เห็นทุกหน้าในกลุ่ม (app)
// อยู่นอก scroll area ของ layout จึงปักอยู่ด้านบนเสมอ
export function AppHeader() {
  return (
    <header className="z-30 flex items-center gap-2.5 border-b-[2.5px] border-outline bg-cream px-4 py-2.5">
      <Link
        href="/"
        aria-label="ClassNote หน้าหลัก"
        className="flex items-center gap-2.5"
      >
        <Image
          src="/logo/logo_app.png"
          alt="ClassNote"
          width={40}
          height={40}
          priority
          className="h-10 w-10 rounded-full border-[2.5px] border-outline object-cover shadow-brutal-sm"
        />
        <span className="text-2xl font-black leading-none tracking-tight">
          ClassNote
        </span>
      </Link>
    </header>
  );
}
