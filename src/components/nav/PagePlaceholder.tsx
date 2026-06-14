import { Mascot, type MascotPose } from "@/components/ui/Mascot";

export function PagePlaceholder({
  pose = "hello",
  title,
  description,
}: {
  pose?: MascotPose;
  title: string;
  description: string;
}) {
  return (
    <main className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <Mascot pose={pose} size={180} priority />
      <h1 className="outlined-title outlined-title-pink text-5xl font-black leading-none">
        {title}
      </h1>
      <p className="max-w-xs text-base font-bold text-dark-text/65">{description}</p>
      <span className="rounded-[0.8rem] border-[2.5px] border-outline bg-soft-yellow px-4 py-2 text-sm font-black shadow-brutal-sm">
        กำลังพัฒนาในเฟสถัดไป
      </span>
    </main>
  );
}
