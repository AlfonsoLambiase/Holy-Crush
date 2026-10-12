"use client";

import { useEffect, useRef, useState } from "react";

const EDGE_FADE = "0.6rem";

function edgeMask(top: boolean, bottom: boolean) {
  if (!top && !bottom) return undefined;

  const head = top ? `transparent 0, #000 ${EDGE_FADE}` : "#000 0";
  const tail = bottom
    ? `#000 calc(100% - ${EDGE_FADE}), transparent 100%`
    : "#000 100%";

  return `linear-gradient(to bottom, ${head}, ${tail})`;
}

type FadeScrollProps = {
  children: React.ReactNode;
  className?: string;
};

export function FadeScroll({ children, className = "" }: FadeScrollProps) {
  const [edges, setEdges] = useState({ top: false, bottom: false });
  const ref = useRef<HTMLDivElement>(null);

  const updateEdges = () => {
    const el = ref.current;

    if (!el) return;

    const top = el.scrollTop > 2;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;

    setEdges((prev) =>
      prev.top === top && prev.bottom === bottom ? prev : { top, bottom }
    );
  };

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    updateEdges();

    const observer = new ResizeObserver(updateEdges);

    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    return () => observer.disconnect();
  }, []);

  const mask = edgeMask(edges.top, edges.bottom);

  return (
    <div
      ref={ref}
      className={`min-h-0 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] ${className}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      onScroll={updateEdges}
    >
      {children}
    </div>
  );
}
