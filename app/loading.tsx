import { Loader2 } from "lucide-react";

export default function Loading() {
  // Define the Loading UI here
  return (
    <div className="flex min-h-100 items-center justify-center">
      <Loader2 className="size-8 animate-spin" />
    </div>
  );
}
