import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegistrationData } from "@/pages/register/Index";

interface ExpectationsStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

const certifications = [
  {
    value: "linguaskill",
    label: "Linguaskill",
    description: "Cambridge English certification recognized worldwide",
  },
  {
    value: "bright",
    label: "Bright Language",
    description: "Professional language assessment certification",
  },
  {
    value: "none",
    label: "No certification",
    description: "I don't need a certification at this time",
  },
];

export function ExpectationsStep({ data, onUpdate, onNext }: ExpectationsStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expectations and Certification</CardTitle>
        <CardDescription>
          Tell us about your goals for this training
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expectations */}
          <div className="space-y-2">
            <Label htmlFor="expectations">What are your expectations for this training?</Label>
            <Textarea
              id="expectations"
              value={data.expectations || ""}
              onChange={(e) => onUpdate({ expectations: e.target.value })}
              placeholder="Describe what you hope to achieve from this language training..."
              className="min-h-[120px]"
            />
            <p className="text-sm text-muted-foreground">
              This helps us tailor the training to your specific needs
            </p>
          </div>

          {/* Certification */}
          <div className="space-y-3">
            <Label>Would you like to obtain a certification?</Label>
            <RadioGroup
              value={data.certification || ""}
              onValueChange={(value) => onUpdate({ certification: value })}
              className="space-y-3"
            >
              {certifications.map((cert) => (
                <div
                  key={cert.value}
                  className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={cert.value} id={cert.value} />
                  <div className="flex-1">
                    <Label htmlFor={cert.value} className="font-medium cursor-pointer">
                      {cert.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {cert.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={!data.certification}
          >
            Continue to Confirmation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
