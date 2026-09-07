import { useId, type ReactNode } from "react";
import { RINK, RINK_FULL_VIEW, fullBoardsPath, fullSvgX, svgLength, svgY } from "@/lib/rink";

export interface RinkFullProps {
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const LINE_BLUE = "#2a78d6";
const LINE_RED = "#e34948";

export function RinkFull({ children, className, ariaLabel = "Full-rink diagram" }: RinkFullProps) {
  const clipId = useId();
  const { blueLineX, goalLineX, halfWidth, faceoffDotX, faceoffCircleY, faceoffCircleRadius } =
    RINK;
  const crease = RINK.paintedCreaseRadius;
  const net = RINK.netHalfWidth;
  const ends = [1, -1];

  return (
    <svg
      viewBox={`0 0 ${RINK_FULL_VIEW.width} ${RINK_FULL_VIEW.height}`}
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={fullBoardsPath()} />
        </clipPath>
      </defs>

      <path d={fullBoardsPath()} fill="white" stroke="#cbd5e1" strokeWidth={2} />

      <g clipPath={`url(#${clipId})`}>{children}</g>

      <g clipPath={`url(#${clipId})`} fill="none" strokeWidth={1.5}>
        <line
          x1={fullSvgX(0)}
          x2={fullSvgX(0)}
          y1={svgY(halfWidth)}
          y2={svgY(-halfWidth)}
          stroke={LINE_RED}
          strokeWidth={4}
        />
        <circle
          cx={fullSvgX(0)}
          cy={svgY(0)}
          r={svgLength(faceoffCircleRadius)}
          stroke={LINE_BLUE}
        />
        <circle
          cx={fullSvgX(0)}
          cy={svgY(0)}
          r={svgLength(RINK.faceoffDotRadius)}
          fill={LINE_BLUE}
          stroke="none"
        />

        {ends.map((side) => (
          <g key={side}>
            <line
              x1={fullSvgX(side * blueLineX)}
              x2={fullSvgX(side * blueLineX)}
              y1={svgY(halfWidth)}
              y2={svgY(-halfWidth)}
              stroke={LINE_BLUE}
              strokeWidth={4}
            />
            <line
              x1={fullSvgX(side * goalLineX)}
              x2={fullSvgX(side * goalLineX)}
              y1={svgY(halfWidth)}
              y2={svgY(-halfWidth)}
              stroke={LINE_RED}
            />
            <rect
              x={side === 1 ? fullSvgX(goalLineX) : fullSvgX(-goalLineX) - svgLength(RINK.netDepth)}
              y={svgY(net)}
              width={svgLength(RINK.netDepth)}
              height={svgLength(net * 2)}
              stroke={LINE_RED}
            />
            <path
              d={`M ${fullSvgX(side * goalLineX)},${svgY(crease)} A ${svgLength(crease)} ${svgLength(crease)} 0 0 ${side === 1 ? 0 : 1} ${fullSvgX(side * goalLineX)},${svgY(-crease)}`}
              stroke={LINE_RED}
            />
            {[faceoffCircleY, -faceoffCircleY].map((y) => (
              <g key={y}>
                <circle
                  cx={fullSvgX(side * faceoffDotX)}
                  cy={svgY(y)}
                  r={svgLength(faceoffCircleRadius)}
                  stroke={LINE_RED}
                />
                <circle
                  cx={fullSvgX(side * faceoffDotX)}
                  cy={svgY(y)}
                  r={svgLength(RINK.faceoffDotRadius)}
                  fill={LINE_RED}
                  stroke="none"
                />
              </g>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
