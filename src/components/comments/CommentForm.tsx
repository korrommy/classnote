"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { useFormStatus } from "react-dom";
import { createComment, type CommentActionState } from "@/lib/interactions/actions";

export function CommentForm({ noteId }: { noteId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<CommentActionState, FormData>(
    createComment.bind(null, noteId),
    {},
  );

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <div className="flex items-end gap-2 rounded-[0.85rem] border-[2.5px] border-outline bg-paper px-3 py-2 shadow-brutal-sm">
        <textarea
          name="content"
          rows={2}
          maxLength={500}
          required
          placeholder="แสดงความคิดเห็น..."
          className="min-w-0 flex-1 resize-none bg-transparent text-base font-normal outline-none placeholder:text-dark-text/45"
        />
        <SendButton />
      </div>
      {state.error && (
        <p className="rounded-[0.75rem] border-[2.5px] border-outline bg-pink-accent px-3 py-2 text-sm font-black">
          {state.error}
        </p>
      )}
    </form>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="ส่งความคิดเห็น"
      className={`flex h-10 w-10 flex-none items-center justify-center rounded-[0.65rem] border-[2.5px] border-outline bg-pink-accent shadow-brutal-sm transition-all active:translate-x-0.5 active:translate-y-0.5 ${pending ? "opacity-60" : ""}`}
    >
      <Send className="h-5 w-5 stroke-[2.6]" />
    </button>
  );
}
