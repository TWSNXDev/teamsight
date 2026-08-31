"use client";

import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@/lib/api";

interface ChatWidgetProps {
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}

export function ChatWidget({
  messages,
  input,
  onInputChange,
  onSubmit,
  loading,
  error,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="size-4 text-primary" />
              Ask about your sales
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X />
            </Button>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                e.g. &quot;Why did sales increase this week?&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={
                    m.role === "user"
                      ? "inline-block max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-left text-sm text-primary-foreground"
                      : "inline-block max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm whitespace-pre-line"
                  }
                >
                  {m.content || "..."}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <p className="mx-4 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <form onSubmit={onSubmit} className="flex gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Ask about your sales data..."
              disabled={loading}
              autoFocus
            />
            <Button type="submit" size="icon" disabled={loading}>
              <Send />
            </Button>
          </form>
        </div>
      )}

      <Button
        size="icon-lg"
        className="rounded-full shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X /> : <MessageCircle />}
      </Button>
    </div>
  );
}
