"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type DataPoint = { date: string; minutes: number };

function getStyle(minutes: number): string {
  if (minutes === 0) return "bg-white/5";
  if (minutes < 30) return "bg-primary/20";
  if (minutes < 60) return "bg-primary/40";
  if (minutes < 120) return "bg-primary/70";
  return "bg-primary glow-neon";
}

export default function ActivityGrid({ data }: { data: DataPoint[] }) {
  const weeks: DataPoint[][] = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5">
            {week.map((day) => (
              <Tooltip key={day.date}>
                <TooltipTrigger>
                  <div className={`h-4 w-4 rounded-sm cursor-default transition-all hover:scale-110 ${getStyle(day.minutes)}`} />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="font-semibold text-xs">{format(new Date(day.date), "dd 'de' MMM", { locale: ptBR })}</p>
                  <p className="text-xs opacity-70">{day.minutes > 0 ? `${day.minutes} min` : "Sem atividade"}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Menos</span>
        {["bg-white/5", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-primary"].map((c, i) => (
          <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}
