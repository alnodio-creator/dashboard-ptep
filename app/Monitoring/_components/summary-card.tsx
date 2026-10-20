import { Card, CardContent } from "@/components/ui/card";

export function SummaryCard({
  title,
  value,
  description,
  icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="group overflow-hidden border-border/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 break-words text-2xl font-bold tracking-tight">
              {value}
            </p>
          </div>

          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${color}`}
          >
            {icon}
          </div>
        </div>

        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
