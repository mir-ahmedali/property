import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      toast({
        title: "Welcome back",
        description: `Logged in as ${loggedInUser.full_name}`,
      });
      if (loggedInUser.role === "super_admin") navigate("/dashboard/super-admin");
      else if (loggedInUser.role === "admin") navigate("/dashboard/admin");
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

  const goToDashboard = () => {
    if (!user) return;
    if (user.role === "super_admin") navigate("/dashboard/super-admin");
    else if (user.role === "admin") navigate("/dashboard/admin");
    else navigate("/dashboard/user");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-600" />
            <div>
              <div className="text-lg font-semibold tracking-tight" data-testid="brand-name">
                Golasco Property
              </div>
            </div>
          </div>
          {user && (
            <Button
              type="button"
              onClick={goToDashboard}
              data-testid="home-go-dashboard-button"
              className="rounded-full border border-emerald-500/50 bg-slate-900/70 px-4 text-xs font-medium text-emerald-300 hover:bg-slate-900"
              variant="outline"
            >
              Go to dashboard
            </Button>
          )}
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-57px)] items-center justify-center px-4 py-10">
        <section className="w-full max-w-md">
          <Card className="border-slate-800 bg-slate-900/80" data-testid="home-login-card">
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2 text-center">
                <h1
                  className="text-4xl font-semibold tracking-tight text-white sm:text-5xl"
                  data-testid="hero-heading"
                >
                  Login to Golasco
                </h1>
                <p className="text-sm text-slate-300" data-testid="hero-subtitle">
                  Single login for Super Admin, Admin, and User. Access changes automatically based on your role.
                </p>
              </div>

              <div className="space-y-2" data-testid="home-role-select-wrapper">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Select access type</p>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger
                    data-testid="home-role-select"
                    className="h-10 border-slate-800 bg-slate-950/80 text-sm focus-visible:ring-emerald-500"
                  >
                    <SelectValue
                      placeholder="Choose role"
                      data-testid="home-role-select-value"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin" data-testid="home-role-option-super-admin">
                      Super Admin – Full system control
                    </SelectItem>
                    <SelectItem value="admin" data-testid="home-role-option-admin">
                      Admin – Own company / branch
                    </SelectItem>
                    <SelectItem value="user" data-testid="home-role-option-user">
                      User – Personal dashboard only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" data-testid="home-login-form">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400" htmlFor="home-email">
                    Email
                  </label>
                  <Input
                    id="home-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 border-slate-700 bg-slate-950/60 text-sm text-slate-50 focus-visible:ring-emerald-500"
                    data-testid="home-login-email-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400" htmlFor="home-password">
                    Password
                  </label>
                  <Input
                    id="home-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 border-slate-700 bg-slate-950/60 text-sm text-slate-50 focus-visible:ring-emerald-500"
                    data-testid="home-login-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="home-login-submit-button"
                  className="mt-2 w-full rounded-full bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>

              <p className="pt-1 text-center text-xs text-slate-400" data-testid="home-register-text">
                New user?{" "}
                <Link
                  to="/register"
                  className="font-medium text-emerald-300 hover:text-emerald-200"
                  data-testid="home-go-register-link"
                >
                  Create an account
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
