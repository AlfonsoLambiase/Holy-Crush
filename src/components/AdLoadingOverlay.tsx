"use client";

/** Sfondo come popup home + spinner marrone #5c3a14 */
export function AdLoadingOverlay({className = "fixed inset-0 z-[200]"}: {className?: string}) {
  return (
    <div
      aria-busy
      aria-live="polite"
      className={`${className} flex items-center justify-center bg-black/80`}
      role="status"
    >
      <div className="ad-loading-spin h-14 w-14 rounded-full border-[6px] border-[#5c3a14]/35 border-t-[#e7c27a] shadow-[0_0_22px_rgba(0,0,0,0.55)]" />
    </div>
  );
}