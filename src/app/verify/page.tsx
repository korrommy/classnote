import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { VerifyForm } from "@/components/auth/VerifyForm";
import { Mascot } from "@/components/ui/Mascot";

export default async function VerifyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("classroom_id")
    .eq("id", user.id)
    .single();

  if (profile?.classroom_id) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-12">
      <header className="text-center">
        <Mascot pose="hello" size={150} className="mx-auto" priority />
        <h1 className="outlined-title outlined-title-blue mt-2 text-5xl font-black leading-none">
          ยืนยันตัวตน
        </h1>
        <p className="mt-3 text-base font-bold text-dark-text/65">
          เลือกห้องและกรอกเลขประจำตัวเพื่อเข้าห้องเรียนของคุณ
        </p>
      </header>
      <Card className="bg-paper/80">
        <VerifyForm />
      </Card>
    </main>
  );
}
