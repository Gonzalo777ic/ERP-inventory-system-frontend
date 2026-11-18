import { Loader2 } from "lucide-react";

const MARK_SRC = "/valeerp-mark.png";

type BrandLoaderProps = {
  label?: string;
};

export function BrandLoader({ label }: BrandLoaderProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <img src={MARK_SRC} alt="" className="h-16 w-16 rounded-lg" />
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
}
