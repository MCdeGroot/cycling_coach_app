"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  content: string;
}

export function FormulaTooltip({ content }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground hover:bg-accent hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ml-1 align-middle"
        aria-label="Formula reference"
      >
        ?
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs text-xs leading-relaxed"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
