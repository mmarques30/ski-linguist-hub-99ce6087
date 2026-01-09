import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, User, Briefcase, BookOpen, Target } from "lucide-react";
import { useState } from "react";
import type { RegistrationData } from "@/pages/register/Index";

interface ConfirmationStepProps {
  data: RegistrationData;
}

const languageLabels: Record<string, string> = {
  english: "English",
  portuguese: "Portuguese",
  russian: "Russian",
  dutch: "Dutch",
};

const modalityLabels: Record<string, string> = {
  in_person: "In-person",
  online_individual: "Online (Individual)",
  online_group: "Online (Group)",
};

const fundingLabels: Record<string, string> = {
  opco: "OPCO / FIFPL",
  company: "Company",
  self: "Self-funded",
};

const certificationLabels: Record<string, string> = {
  linguaskill: "Linguaskill",
  bright: "Bright Language",
  none: "No certification",
};

export function ConfirmationStep({ data }: ConfirmationStepProps) {
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // Here we would submit to the database
    console.log("Submitting registration:", data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold">Registration Complete</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Thank you for registering with France Langues International. 
              You will receive a confirmation email shortly with further instructions.
            </p>
            <div className="pt-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Registration ID: FLI-{Date.now().toString(36).toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Your Registration</CardTitle>
        <CardDescription>
          Please review your information before submitting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            Personal Information
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{data.civility === "madame" ? "Mme" : "M."} {data.firstName} {data.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{data.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium">{data.address}, {data.postalCode} {data.city}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Professional Profile */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="h-4 w-4" />
            Professional Profile
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profession</span>
              <span className="font-medium">
                {data.profession === "ski_instructor" ? "Ski Instructor" : "Other"}
              </span>
            </div>
            {data.skiSchool && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ski School</span>
                <span className="font-medium">{data.skiSchool}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Training Configuration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookOpen className="h-4 w-4" />
            Training Configuration
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Language</span>
              <span className="font-medium">{languageLabels[data.language] || data.language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{data.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modality</span>
              <span className="font-medium">{modalityLabels[data.modality] || data.modality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Funding</span>
              <span className="font-medium">{fundingLabels[data.fundingType] || data.fundingType}</span>
            </div>
            {data.location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{data.location}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Level and Certification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" />
            Level and Certification
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Level</span>
              <Badge>{data.currentLevel}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Certification</span>
              <span className="font-medium">{certificationLabels[data.certification] || data.certification}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <Checkbox
            id="terms"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="terms" className="cursor-pointer">
              I accept the terms and conditions
            </Label>
            <p className="text-sm text-muted-foreground">
              By submitting this registration, I confirm that the information provided is accurate 
              and I agree to the training terms and conditions of France Langues International.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={!accepted}
        >
          Submit Registration
        </Button>
      </CardContent>
    </Card>
  );
}
