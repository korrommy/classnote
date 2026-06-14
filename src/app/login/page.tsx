import { LoginForm } from "@/components/auth/LoginForm";
import { Mascot } from "@/components/ui/Mascot";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-cream px-5 pb-8 pt-[74px]">
      <Image
        src="/doodles/clover.png"
        alt=""
        width={70}
        height={70}
        className="absolute left-8 top-[150px] h-[52px] w-[52px] object-contain"
      />
      <Image
        src="/doodles/ladybug.png"
        alt=""
        width={58}
        height={58}
        className="absolute right-10 top-[116px] h-[42px] w-[42px] rotate-12 object-contain"
      />

      <section className="relative mx-auto flex w-full max-w-[360px] flex-col items-center">
        <h1 className="outlined-title outlined-title-pink text-center text-[clamp(3rem,14vw,4.15rem)] leading-none">
          เข้าสู่ระบบ
        </h1>

        <Mascot
          pose="hello"
          size={190}
          priority
          className="mt-5 translate-x-2"
        />

        <div className="cartoon-panel mt-1 w-full bg-paper/90 px-5 py-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
