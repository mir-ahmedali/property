import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register({ full_name: fullName, email, password });
      toast({
        title: "Account created",
        description: `Welcome ${user.full_name}. Your account is pending Super Admin approval.`,
      });
      navigate("/dashboard/user");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.detail || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white" data-testid="register-title">
            Create your customer account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
            <div>
              <Label htmlFor="fullName" className="text-slate-300">
                Full Name
              </Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 border-slate-700 bg-slate-950/60 text-sm text-slate-50 focus-visible:ring-emerald-500"
                data-testid="register-fullname-input"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 border-slate-700 bg-slate-950/60 text-sm text-slate-50 focus-visible:ring-emerald-500"
                data-testid="register-email-input"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-slate-700 bg-slate-950/60 text-sm text-slate-50 focus-visible:ring-emerald-500"
                data-testid="register-password-input"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-button"
              className="mt-2 w-full rounded-full bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              data-testid="register-go-login-link"
              className="font-medium text-emerald-300 hover:text-emerald-200"
            >
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
