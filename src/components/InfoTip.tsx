import React from "react";

export function InfoTip({ text }: { text: string }) {
  return (
    <span
      className="ml-2 inline-flex cursor-help items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-200 hover:bg-cyan-400/15"
      title={text}
    >
      ⓘ
    </span>
  );
}
