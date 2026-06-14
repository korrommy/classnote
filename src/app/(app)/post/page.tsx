import Image from "next/image";
import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";

export default function PostPage() {
  return (
    <main className="flex h-full w-full flex-col overflow-hidden px-[27px] pb-0 pt-[37px]">
      <section className="relative h-full min-h-0">
        <h1 className="outlined-title text-[3.05rem] leading-none">
          <span className="outlined-title-pink">เพิ่ม</span>
          <span className="outlined-title-green">โพสต์</span>
        </h1>

        <section className="mt-[22px] h-[340px] w-full rounded-[0.65rem] border border-outline bg-baby-blue p-[17px]">
          <div className="flex h-full flex-col items-center rounded-[0.4rem] border border-outline bg-[#cdbcf6] px-5 pb-6 pt-7">
            <Image
              src="/icons/post-folder.png"
              alt=""
              width={157}
              height={157}
              priority
              className="h-[157px] w-[157px] object-contain"
            />

            <h2 className="mt-2 text-center text-[1.7rem] leading-none text-pink-accent [text-shadow:1px_1px_0_#080808,-1px_1px_0_#080808,1px_-1px_0_#080808,-1px_-1px_0_#080808]">
              โพสต์งาน
            </h2>
            <p className="mt-2 text-center text-[0.62rem] leading-none">
              แชร์โน้ต สรุปบทเรียน หรือไฟล์สอบ
            </p>

            <Link
              href="/post/create"
              className="mt-5 flex h-[31px] w-[194px] items-center justify-center rounded-[0.55rem] border border-outline bg-mint text-[1.45rem] leading-none shadow-[0_2.4px_2.4px_0_#080808]"
            >
              กดเลย
            </Link>
          </div>
        </section>

        <Mascot
          pose="duo"
          size={282}
          priority
          className="absolute left-[26px] top-[380px]"
        />
      </section>
    </main>
  );
}
