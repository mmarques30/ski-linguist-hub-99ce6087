import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegistrationData } from "@/pages/register/Index";

interface ProfessionalProfileStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export function ProfessionalProfileStep({ data, onUpdate, onNext }: ProfessionalProfileStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Profile</CardTitle>
        <CardDescription>
          Tell us about your professional background
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profession */}
          <div className="space-y-3">
            <Label>What is your profession?</Label>
            <RadioGroup
              value={data.profession || ""}
              onValueChange={(value) => onUpdate({ profession: value as "ski_instructor" | "other" })}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="ski_instructor" id="ski_instructor" />
                <div>
                  <Label htmlFor="ski_instructor" className="font-medium cursor-pointer">
                    Ski Instructor (Moniteur de ski)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    I work as a ski instructor at a French ski school
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="other" id="other" />
                <div>
                  <Label htmlFor="other" className="font-medium cursor-pointer">
                    Other Profession
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    I have a different profession
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Ski School - Only show for ski instructors */}
          {data.profession === "ski_instructor" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label htmlFor="skiSchool">Ski School</Label>
              <Input
                id="skiSchool"
                value={data.skiSchool || ""}
                onChange={(e) => onUpdate({ skiSchool: e.target.value })}
                placeholder="e.g., ESF Val d'Isère, ESF Courchevel..."
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter the name of your ski school
              </p>
            </div>
          )}

          {data.profession === "other" && (
            <div className="rounded-lg bg-muted/50 p-4 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-muted-foreground">
                Our training programs are primarily designed for ski instructors. 
                Please contact us directly at <span className="font-medium text-foreground">contact@fli-langues.fr</span> to 
                discuss your specific needs.
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={!data.profession || (data.profession === "ski_instructor" && !data.skiSchool)}
          >
            Continue to Training Configuration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
