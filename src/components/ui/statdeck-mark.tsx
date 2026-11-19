import React from "react";

export interface StatDeckMarkProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  frameColor?: string;
  barColor?: string;
}

/**
 * Geometric StatDeck brandmark:
 * Crisp rounded square frame (rx="5") with three ascending vertical rounded bars.
 */
export function StatDeckMark({
  className = "w-4 h-4",
  frameColor = "currentColor",
  barColor = "#2563EB",
  ...props
}: StatDeckMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer rounded square frame */}
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5"
        stroke={frameColor}
        strokeWidth="2.4"
      />
      {/* Ascending vertical rounded bars */}
      <rect x="6.5" y="12.5" width="2.5" height="6.5" rx="1.25" fill={barColor} />
      <rect x="10.75" y="9" width="2.5" height="10" rx="1.25" fill={barColor} />
      <rect x="15" y="5.5" width="2.5" height="13.5" rx="1.25" fill={barColor} />
    </svg>
  );
}
