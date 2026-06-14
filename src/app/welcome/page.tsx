import Link from "next/link";
import Image from "next/image";
import { ArrowRight, UserRound } from "lucide-react";

export default function WelcomePage() {
  return (
    <main className="relative h-dvh min-h-[820px] w-full overflow-hidden bg-cream text-center md:h-full md:min-h-0">
      <header className="absolute left-0 right-0 top-[54px] z-30 px-4">
        <h1 className="outlined-title mx-auto w-fit whitespace-nowrap text-[clamp(3.55rem,16vw,4.4rem)] font-black leading-[0.88]">
          <span>ห้อง</span>
          <span className="outlined-title-pink">เรียน</span>
        </h1>
        <p className="outlined-title outlined-title-blue mt-3 whitespace-nowrap text-[clamp(2.15rem,10vw,2.7rem)] font-black leading-none">
          โน้ต สรุป งาน
        </p>
      </header>

      <Image
        src="/doodles/clover.png"
        alt=""
        width={92}
        height={92}
        className="absolute left-[7%] top-[184px] z-20 h-[70px] w-[70px] -rotate-12 object-contain opacity-90"
      />
      <Image
        src="/doodles/clover.png"
        alt=""
        width={92}
        height={92}
        className="absolute right-[8%] top-[248px] z-20 h-[78px] w-[78px] rotate-12 object-contain opacity-90"
      />
      <Image
        src="/doodles/clover.png"
        alt=""
        width={72}
        height={72}
        className="absolute left-[28%] top-[280px] z-20 h-[50px] w-[50px] rotate-12 object-contain opacity-95"
      />

      <section
        aria-hidden
        className="absolute bottom-[-58px] left-1/2 z-10 h-[360px] w-[680px] -translate-x-1/2 rounded-t-[50%] border-t-[3px] border-outline bg-[#e7d2df]"
      />

      <Image
        src="/mascot/star-reading.png"
        alt="น้องดาวอ่านหนังสือ"
        width={900}
        height={675}
        priority
        className="absolute left-[55%] top-[135px] z-20 h-[553px] w-[553px] max-w-none -translate-x-1/2 object-contain"
      />

      <section className="absolute bottom-[54px] left-0 right-0 z-30 px-7">
        <div className="mx-auto flex w-full max-w-[328px] flex-col gap-4">
          <WelcomeButton
            href="/login"
            label="เข้าสู่ระบบ"
            tone="green"
            align="login"
            leading={
              <Image
                src="/doodles/ladybug.png"
                alt=""
                width={100}
                height={84}
                className="h-[83px] w-[83px] object-contain"
              />
            }
            trailing={<ArrowRight className="h-8 w-8 stroke-[3]" />}
          />

          <WelcomeButton
            href="/register"
            label="สมัครสมาชิก"
            tone="cream"
            leading={
              <Image
                src="/doodles/clover.png"
                alt=""
                width={68}
                height={68}
                className="h-[64px] w-[64px] object-contain"
              />
            }
            trailing={<UserRound className="h-8 w-8 stroke-[3]" />}
          />
        </div>
      </section>
    </main>
  );
}

function WelcomeButton({
  href,
  label,
  tone,
  leading,
  trailing,
  align = "default",
}: {
  href: string;
  label: string;
  tone: "green" | "cream";
  leading: React.ReactNode;
  trailing: React.ReactNode;
  align?: "default" | "login";
}) {
  const layout =
    align === "login"
      ? "grid-cols-[86px_1fr_58px] px-1"
      : "grid-cols-[76px_1fr_48px] px-2";

  return (
    <Link
      href={href}
      className={`grid h-[72px] ${layout} items-center rounded-[0.9rem] border-[2.5px] border-outline text-[clamp(1.55rem,7vw,1.78rem)] font-black leading-none shadow-brutal transition-[transform,box-shadow] duration-[120ms] ease-[cubic-bezier(.25,.46,.45,.94)] hover:-translate-y-[2px] hover:shadow-brutal-lg active:translate-x-[5px] active:translate-y-[7px] active:shadow-none active:duration-[90ms] motion-reduce:transition-none ${
        tone === "green" ? "bg-green-accent" : "bg-[#fdf1c9]"
      }`}
    >
      <span className="flex items-center justify-start">{leading}</span>
      <span className="whitespace-nowrap text-center">{label}</span>
      <span className="flex h-11 w-11 items-center justify-center rounded-[0.48rem] border-[2.5px] border-outline bg-paper">
        {trailing}
      </span>
    </Link>
  );
}
