import Image from "next/image";
import Link from "next/link";

export default function LoadingPage() {
  return (
    <main className="relative h-dvh min-h-[844px] w-full overflow-hidden bg-[#fbf8dc] text-center md:h-full md:min-h-0">
      <Image
        src="/illustrations/welcome-screen.png.png"
        alt="น้องดาวทักทาย"
        fill
        priority
        sizes="390px"
        className="object-cover object-center -mt-3"
      />

      <Image
        src="/illustrations/Untitled design (1).png"
        alt="Welcome"
        width={760}
        height={428}
        priority
        className="absolute left-1/2 top-[0px] z-10 w-[min(92vw,365px)] -translate-x-1/2 object-contain"
      />

      <Link
        href="/"
        className="absolute bottom-[80px] left-1/2 z-20 flex h-[74px] w-[min(80vw,344px)] -translate-x-1/2 items-center justify-center rounded-[1rem] border-[2.5px] border-outline bg-[#cfe8b8] text-[clamp(1.75rem,9.5vw,2.15rem)] font-black leading-none shadow-[0_8px_0_#080808,0_11px_10px_rgba(0,0,0,0.22)] transition-all active:translate-x-[calc(-50%+5px)] active:translate-y-[7px] active:shadow-none"
      >
        Get started!
      </Link>
    </main>
  );
}
