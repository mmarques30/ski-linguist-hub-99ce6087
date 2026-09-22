import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateScoreOptions, scoreToLevel } from "@/lib/evaluation-utils";
import { StatusPill } from "@/components/ui-kit";

interface ScoreInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  scoringSystem: 'sur_5' | 'sur_20';
}

export function ScoreInput({ label, value, onChange, scoringSystem }: ScoreInputProps) {
  const options = generateScoreOptions(scoringSystem);
  const level = scoreToLevel(value, scoringSystem);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Select
          value={value.toString()}
          onValueChange={(v) => onChange(parseFloat(v))}
        >
          <SelectTrigger className="w-24 tabular" aria-label={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt.toString()}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <StatusPill tone="neutral" size="sm">
          {level}
        </StatusPill>
      </div>
    </div>
  );
}
