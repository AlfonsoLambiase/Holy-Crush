"use client";

/** Sfondo come popup home + spinner marrone #5c3a14 */
export function AdLoadingOverlay({className = "fixed inset-0 z-[200]"}: {className?: string}) {
  return (
    <div
      aria-busy
      aria-live="polite"
      className={`${className} flex items-center justify-center bg-black/55`}
      role="status"
    >
      <div className="ad-loading-spin h-11 w-11 rounded-full border-[3px] border-[#5c3a14]/25 border-t-[#5c3a14]" />
    </div>
  );
}