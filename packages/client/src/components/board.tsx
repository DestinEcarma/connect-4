import { useState } from "react";

import { Dot, Star } from "lucide-react";

import { bitboardToGrid, fromLocation } from "@connect-4/shared";

import { cn } from "@/lib/utils";

interface BoardProps {
  className?: string;
  boards: bigint[];
  isTurn?: boolean;
  lastMove?: { column: number; row: number };
  winningMask?: bigint;
  onClick?: (column: number) => void;
}

function Board({ className, boards, isTurn, lastMove, winningMask, onClick }: BoardProps) {
  const grid = bitboardToGrid(boards[0], boards[1]);
  const [highlightCol, setHighlightCol] = useState<number | null>(null);

  if (!isTurn && highlightCol !== null) setHighlightCol(null);

  return (
    <div
      data-is-turn={isTurn}
      onMouseLeave={() => setHighlightCol(null)}
      onTouchEnd={() => setHighlightCol(null)}
      className={cn(
        "bg-card border-border grid w-full max-w-3xl grid-cols-7 grid-rows-6 rounded-4xl shadow-lg select-none data-[is-turn=true]:cursor-pointer",
        className,
      )}
    >
      {grid.map((rows, row) =>
        rows.map((colValue, col) => {
          const isWinningCell = winningMask !== undefined && (winningMask & (1n << fromLocation(5 - row, col))) !== 0n;
          const isCellLastMove = lastMove?.row === 5 - row && lastMove?.column === col;

          return (
            <div
              key={`${row}-${col}`}
              data-highlight={col === highlightCol}
              onMouseEnter={() => isTurn && setHighlightCol(col)}
              onTouchMove={() => isTurn && setHighlightCol(col)}
              onClick={() => isTurn && onClick?.(col)}
              className="aspect-square size-full p-2 data-[highlight=true]:bg-gray-400/40"
            >
              <div
                data-player={colValue}
                className="bg-background border-border group size-full rounded-full not-data-player:border"
              >
                {colValue !== null && (
                  <div className="animate-expand group-data-[player=0]:bg-light group-data-[player=1]:bg-dark flex size-full items-center justify-center rounded-full p-4">
                    {isWinningCell ? (
                      <Star
                        className="animate-pop-in size-full transition-transform delay-250"
                        fill="white"
                        strokeWidth={0}
                      />
                    ) : isCellLastMove ? (
                      <Dot className="size-full text-white" />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        }),
      )}
    </div>
  );
}

export { Board };
