import Image from "next/image";
import { cn } from "@/lib/utils";

export type MascotPose =
  | "reading"
  | "thumbsup"
  | "hello"
  | "add"
  | "sitting"
  | "duo";

const POSES: Record<MascotPose, { src: string; alt: string }> = {
  reading: { src: "/mascot/star-reading.png", alt: "น้องดาวอ่านหนังสือ" },
  thumbsup: { src: "/mascot/star-thumbsup.png", alt: "น้องดาวยกนิ้วโป้ง" },
  hello: { src: "/mascot/star-hello.png", alt: "น้องดาวทักทาย" },
  add: { src: "/mascot/star-add.png", alt: "น้องดาวเพิ่มไฟล์" },
  sitting: { src: "/mascot/star-sitting.png", alt: "น้องดาวนั่ง" },
  duo: { src: "/mascot/star-duo.png", alt: "น้องดาวคู่โพสต์งาน" },
};

export function Mascot({
  pose,
  size = 120,
  className,
  priority,
}: {
  pose: MascotPose;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const { src, alt } = POSES[pose];
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn("h-auto w-auto select-none object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
