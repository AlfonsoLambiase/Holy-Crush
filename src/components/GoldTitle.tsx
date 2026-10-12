export function GoldTitle({
  children,
  className = "",
  titleClassName,
  titleStyle,
}: {
  children: React.ReactNode;
  className?: string;
  titleClassName: string;
  titleStyle?: React.CSSProperties;
}) {
  return (
    <div className={`flex w-full items-center gap-2 ${className}`}>
      <span className="h-0.5 min-w-4 flex-1 bg-[#c4a15a]" />
      <p className={`shrink-0 text-center ${titleClassName}`} style={titleStyle}>
        {children}
      </p>
      <span className="h-0.5 min-w-4 flex-1 bg-[#c4a15a]" />
    </div>
  );
}
