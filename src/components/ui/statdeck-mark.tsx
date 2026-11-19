import React from "react";

export interface StatDeckMarkProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  frameColor?: string;
  innerColor?: string;
  barColor?: string;
  hasBorder?: boolean;
}

/**
 * Official StatDeck Brandmark:
 * Precision geometric squircle frame with white inner window and three ascending vertical rounded bars.
 */
export function StatDeckMark({
  className = "w-4 h-4",
  frameColor = "#0F172A",
  innerColor = "#FFFFFF",
  barColor = "#2563EB",
  hasBorder = true,
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
      {/* Outer rounded squircle frame */}
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        fill={frameColor}
        stroke={hasBorder ? "rgba(255,255,255,0.12)" : "none"}
        strokeWidth="0.5"
      />
      {/* Inner contrast window */}
      <rect
        x="4.7"
        y="4.7"
        width="14.6"
        height="14.6"
        rx="2.6"
        fill={innerColor}
      />
      {/* Three ascending vertical rounded bars with flat bottom edge */}
      <path
        d="M 6.33 19.3 V 14.4 A 1.5 1.5 0 0 1 9.33 14.4 V 19.3 Z"
        fill={barColor}
      />
      <path
        d="M 10.48 19.3 V 11.46 A 1.5 1.5 0 0 1 13.48 11.46 V 19.3 Z"
        fill={barColor}
      />
      <path
        d="M 14.63 19.3 V 8.0 A 1.5 1.5 0 0 1 17.63 8.0 V 19.3 Z"
        fill={barColor}
      />
    </svg>
  );
}
