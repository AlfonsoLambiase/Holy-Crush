export function GoldTitle({
  children,
  className = "",
  titleClassName,
  titleStyle,
  showRules = true,
}: {
  children: React.ReactNode;
  className?: string;
  titleClassName: string;
  titleStyle?: React.CSSProperties;
  /** Linee dorate ai lati (es. disattivate nei popup stretti). */
  showRules?: boolean;
}) {
  const title = (
    <p className={`text-center ${titleClassName}`} style={titleStyle}>
      {children}
    </p>
  );

  if (!showRules) {
    return (
      <div className={`w-full min-w-0 ${className}`}>
        <p
          className={`w-full min-w-0 text-balance break-words text-center ${titleClassName}`}
          style={titleStyle}
        >
          {children}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex w-full items-center gap-2 ${className}`}>
      <span className="h-0.5 min-w-4 flex-1 bg-[#c4a15a]" />
      <span className="shrink-0">{title}</span>
      <span className="h-0.5 min-w-4 flex-1 bg-[#c4a15a]" />
    </div>
  );
}
