import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type"
> & {
  /** Libellé accessible du bouton afficher/masquer */
  toggleLabelShow?: string;
  toggleLabelHide?: string;
};

/** Champ mot de passe avec bouton « voir / masquer ». */
export function PasswordInput({
  className,
  disabled,
  toggleLabelShow = "Voir le mot de passe",
  toggleLabelHide = "Masquer le mot de passe",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("h-11 pr-11 transition-all duration-200", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
        aria-label={visible ? toggleLabelHide : toggleLabelShow}
        title={visible ? toggleLabelHide : toggleLabelShow}
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
