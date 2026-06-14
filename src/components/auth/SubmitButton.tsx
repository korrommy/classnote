"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/Button";

interface SubmitButtonProps extends ButtonProps {
  pendingLabel?: string;
}

export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} {...props}>
      {pending ? (pendingLabel ?? "กำลังดำเนินการ...") : children}
    </Button>
  );
}
