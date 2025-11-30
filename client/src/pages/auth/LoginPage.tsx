import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { loginSchema, type LoginCredentials, type AuthResponse } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ClipboardList, Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginCredentials) =>
      apiRequest<AuthResponse>("POST", "/auth/login", data),
    onSuccess: (response) => {
      login(response);
      
      const redirectPath =
        response.user.role === "manager"
          ? "/manager/dashboard"
          : "/employee/dashboard";
      
      // Use setTimeout to ensure state is updated before navigation
      setTimeout(() => {
        navigate(redirectPath);
        toast({
          title: "Welcome back!",
          description: `Logged in as ${response.user.name}`,
        });
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <Card className="shadow-xl border border-border/50">
          <CardHeader className="space-y-6 text-center pb-10 pt-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-bold tracking-tight">Welcome Back</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Sign in to your attendance account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pb-10 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="h-11 pl-10"
                            data-testid="input-email"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="h-11 pl-10"
                            data-testid="input-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold mt-6"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground font-medium">OR</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            <div className="text-center text-sm">
              <p className="text-muted-foreground">Don't have an account?</p>
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline mt-1 inline-block"
                data-testid="link-register"
              >
                Create one now
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials Section - Below Card */}
        <div className="mt-6 bg-primary/8 border border-primary/20 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary"></div>
            Demo Credentials
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Manager</p>
              <p className="text-muted-foreground font-mono">manager@example.com</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Employee</p>
              <p className="text-muted-foreground font-mono">employee1@example.com</p>
            </div>
            <div className="col-span-2 pt-3 border-t border-primary/15">
              <p className="font-semibold text-foreground mb-1">Password (all accounts)</p>
              <p className="text-muted-foreground font-mono bg-background/50 rounded px-2 py-1 inline-block">
                password123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
