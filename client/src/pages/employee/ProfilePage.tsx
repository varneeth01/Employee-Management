import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Building2,
  BadgeCheck,
  Calendar,
  Shield,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const profileItems = [
    {
      icon: User,
      label: "Full Name",
      value: user.name,
    },
    {
      icon: Mail,
      label: "Email Address",
      value: user.email,
    },
    {
      icon: BadgeCheck,
      label: "Employee ID",
      value: user.employeeId,
      mono: true,
    },
    {
      icon: Building2,
      label: "Department",
      value: user.department,
    },
    {
      icon: Shield,
      label: "Role",
      value: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      badge: true,
    },
    {
      icon: Calendar,
      label: "Member Since",
      value: format(parseISO(user.createdAt), "MMMM d, yyyy"),
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            My Profile
          </h1>
          <p className="text-muted-foreground mt-1">
            View your account information
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="capitalize">
                    {user.role}
                  </Badge>
                  <span className="text-muted-foreground">|</span>
                  <span className="font-mono text-sm">{user.employeeId}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <div className="space-y-6">
              {profileItems.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    {item.badge ? (
                      <Badge variant="secondary" className="mt-1 capitalize">
                        {item.value}
                      </Badge>
                    ) : (
                      <p
                        className={`mt-1 font-medium ${
                          item.mono ? "font-mono" : ""
                        }`}
                        data-testid={`text-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {item.value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
            <CardDescription>
              Your profile information is managed by your organization.
              Contact your HR department for any changes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
