import { RegisterForm } from "@/components/auth/RegisterForm";
import { Mascot } from "@/components/ui/Mascot";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <main className="relative w-full flex-1 overflow-y-auto bg-cream px-5 pb-9 pt-[62px]">
      <Image
        src="/doodles/clover.png"
        alt=""
        width={70}
        height={70}
        className="absolute left-7 top-[124px] h-[48px] w-[48px] object-contain"
      />
      <Image
        src="/doodles/ladybug.png"
        alt=""
        width={56}
        height={56}
        className="absolute right-9 top-[78px] h-[38px] w-[38px] rotate-12 object-contain"
      />

      <section className="relative mx-auto flex w-full max-w-[360px] flex-col">
        <h1 className="outlined-title text-center text-[clamp(2.75rem,13vw,3.9rem)] leading-none">
          สมัคร<span className="outlined-title-pink">สมาชิก</span>
        </h1>

        <Mascot
          pose="thumbsup"
          size={112}
          priority
          className="absolute -right-2 top-[57px] z-10"
        />

        <div className="cartoon-panel mt-[78px] bg-paper/90 px-4 py-5">
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
