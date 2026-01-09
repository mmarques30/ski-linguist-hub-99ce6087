import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegistrationData } from "@/pages/register/Index";

interface PersonalInfoStepProps {
  data: Partial<RegistrationData>;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export function PersonalInfoStep({ data, onUpdate, onNext }: PersonalInfoStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Please provide your personal details for the registration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Civility */}
          <div className="space-y-3">
            <Label>Civility</Label>
            <RadioGroup
              value={data.civility || ""}
              onValueChange={(value) => onUpdate({ civility: value })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="madame" id="madame" />
                <Label htmlFor="madame" className="font-normal">Madame</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monsieur" id="monsieur" />
                <Label htmlFor="monsieur" className="font-normal">Monsieur</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Name */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={data.firstName || ""}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={data.lastName || ""}
                onChange={(e) => onUpdate({ lastName: e.target.value })}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email || ""}
                onChange={(e) => onUpdate({ email: e.target.value })}
                placeholder="your.email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Mobile)</Label>
              <Input
                id="phone"
                type="tel"
                value={data.phone || ""}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                placeholder="+33 6 00 00 00 00"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={data.address || ""}
              onChange={(e) => onUpdate({ address: e.target.value })}
              placeholder="Street address"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={data.postalCode || ""}
                onChange={(e) => onUpdate({ postalCode: e.target.value })}
                placeholder="73000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={data.city || ""}
                onChange={(e) => onUpdate({ city: e.target.value })}
                placeholder="City name"
                required
              />
            </div>
          </div>

          {/* Handicap */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Disability Accommodation</p>
              <p className="text-sm text-muted-foreground">
                Do you require any special accommodations due to a disability?
              </p>
            </div>
            <Switch
              checked={data.hasHandicap || false}
              onCheckedChange={(checked) => onUpdate({ hasHandicap: checked })}
            />
          </div>

          <Button type="submit" className="w-full">
            Continue to Professional Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
