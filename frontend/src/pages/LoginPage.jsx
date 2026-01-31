import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast({
        title: "Welcome back",
        description: `Logged in as ${user.full_name}`,
      });
      if (user.role === "super_admin") navigate("/dashboard/super-admin");
      else if (user.role === "admin") navigate("/dashboard/admin");
      else navigate("/dashboard/user");
    } catch (error) {
      let description = "Invalid credentials";
      if (error.response?.data?.detail) {
        description = typeof error.response.data.detail === "string"
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail);
      }
      toast({
        title: "Login failed",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/80">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white" data-testid="login-title">
            Login to Golasco Property
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
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
                data-testid="login-email-input"
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
                data-testid="login-password-input"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-button"
              className="mt-2 w-full rounded-full bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-400">
            New here?{" "}
            <Link
              to="/register"
              data-testid="login-go-register-link"
              className="font-medium text-emerald-300 hover:text-emerald-200"
            >
              Create a customer account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
