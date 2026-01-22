import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  function computePos() {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 10,
      left: r.left,
      width: Math.min(320, Math.max(220, window.innerWidth - 24)),
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    computePos();
    const id = requestAnimationFrame(computePos);
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onScroll = () => computePos();
    const onResize = () => computePos();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <>
      <span
        ref={anchorRef}
        className="infoTip"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        tabIndex={0}
        role="note"
        aria-label={text}
      >
        ⓘ
      </span>

      {open && pos
        ? createPortal(
            <div
              className="tipBubble"
              role="tooltip"
              style={{
                position: "fixed",
                top: pos.top,
                left: Math.min(pos.left, window.innerWidth - pos.width - 12),
                width: pos.width,
              }}
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
