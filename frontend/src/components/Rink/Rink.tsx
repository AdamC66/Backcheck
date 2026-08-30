import { useId, type ReactNode } from "react";
import { RINK, RINK_VIEW, boardsPath, svgLength, svgX, svgY } from "@/lib/rink";

export interface RinkProps {
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
  markings?: boolean;
}

const LINE_BLUE = "#2a78d6";
const LINE_RED = "#e34948";

export function Rink({
  children,
  className,
  ariaLabel = "Offensive-zone rink diagram",
  markings = true,
}: RinkProps) {
  const clipId = useId();
  const { blueLineX, goalLineX, halfWidth, faceoffDotX, faceoffCircleY, faceoffCircleRadius } =
    RINK;
  const crease = RINK.paintedCreaseRadius;
  const net = RINK.netHalfWidth;

  return (
    <svg
      viewBox={`0 0 ${RINK_VIEW.width} ${RINK_VIEW.height}`}
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={boardsPath()} />
        </clipPath>
      </defs>

      <path d={boardsPath()} fill="white" stroke="#cbd5e1" strokeWidth={2} />

      <g clipPath={`url(#${clipId})`}>{children}</g>

      <g clipPath={`url(#${clipId})`} fill="none" strokeWidth={1.5}>
        <line
          x1={svgX(blueLineX)}
          x2={svgX(blueLineX)}
          y1={svgY(halfWidth)}
          y2={svgY(-halfWidth)}
          stroke={LINE_BLUE}
          strokeWidth={4}
        />
        <line
          x1={svgX(goalLineX)}
          x2={svgX(goalLineX)}
          y1={svgY(halfWidth)}
          y2={svgY(-halfWidth)}
          stroke={LINE_RED}
        />
        <rect
          x={svgX(goalLineX)}
          y={svgY(net)}
          width={svgLength(RINK.netDepth)}
          height={svgLength(net * 2)}
          stroke={LINE_RED}
        />

        {markings ? (
          <>
            <path
              d={`M ${svgX(goalLineX)},${svgY(crease)} A ${svgLength(crease)} ${svgLength(crease)} 0 0 0 ${svgX(goalLineX)},${svgY(-crease)}`}
              stroke={LINE_RED}
            />
            {[faceoffCircleY, -faceoffCircleY].map((y) => (
              <g key={y}>
                <circle
                  cx={svgX(faceoffDotX)}
                  cy={svgY(y)}
                  r={svgLength(faceoffCircleRadius)}
                  stroke={LINE_RED}
                />
                <circle
                  cx={svgX(faceoffDotX)}
                  cy={svgY(y)}
                  r={svgLength(RINK.faceoffDotRadius)}
                  fill={LINE_RED}
                  stroke="none"
                />
              </g>
            ))}
          </>
        ) : null}
      </g>
    </svg>
  );
}
