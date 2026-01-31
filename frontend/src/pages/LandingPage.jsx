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
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-slate-50">
      <header className="border-b border-yellow-500/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-yellow-500/40 bg-black text-xl font-bold text-yellow-400">
              GP
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight text-white" data-testid="brand-name">
                Golasco Property
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-yellow-400/80">Urban luxury real estate</p>
            </div>
          </div>
          {user && (
            <Button
              type="button"
              onClick={goToDashboard}
              data-testid="home-go-dashboard-button"
              className="rounded-full border border-yellow-500/60 bg-black px-4 text-xs font-medium text-yellow-100 hover:bg-yellow-500/10"
              variant="outline"
            >
              Go to dashboard
            </Button>
          )}
        </div>
      </header>

      <main className="relative flex min-h-[calc(100vh-57px)] items-center justify-center overflow-hidden px-4 py-10">
        {/* animated real-estate skyline background */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute inset-x-0 bottom-12 mx-auto flex max-w-6xl items-end justify-between gap-4">
            <div className="h-24 w-10 rounded-t-md bg-gradient-to-t from-yellow-500/60 via-yellow-400/30 to-transparent animate-[pulse_4s_ease-in-out_infinite]" />
            <div className="h-32 w-12 rounded-t-md bg-gradient-to-t from-yellow-400/70 via-yellow-300/40 to-transparent animate-[pulse_4s_ease-in-out_infinite_0.8s]" />
            <div className="h-20 w-8 rounded-t-md bg-gradient-to-t from-yellow-500/50 via-yellow-300/30 to-transparent animate-[pulse_4s_ease-in-out_infinite_0.4s]" />
            <div className="h-28 w-14 rounded-t-md bg-gradient-to-t from-yellow-400/80 via-yellow-200/40 to-transparent animate-[pulse_4s_ease-in-out_infinite_1.2s]" />
            <div className="h-22 w-9 rounded-t-md bg-gradient-to-t from-yellow-500/60 via-yellow-200/30 to-transparent animate-[pulse_4s_ease-in-out_infinite_0.2s]" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

        {/* white real-estate card foreground */}
        <section className="relative w-full max-w-md">
          <Card className="border-yellow-500/20 bg-white text-slate-900 shadow-[0_22px_60px_rgba(0,0,0,0.9)]" data-testid="home-login-card">
            <CardContent className="space-y-7 p-6">
              <div className="space-y-2 text-center">
                <h1
                  className="text-4xl font-semibold tracking-tight text-white sm:text-5xl"
                  data-testid="hero-heading"
                >
                  Login to Golasco
                </h1>
                <p className="text-sm text-slate-300" data-testid="hero-subtitle">
                  One secure gateway for <span className="font-semibold text-emerald-300">Super Admin</span>, {" "}
                  <span className="font-semibold text-cyan-300">Admin</span> and {" "}
                  <span className="font-semibold text-slate-100">Users</span>.
                </p>
              </div>

              <div className="space-y-3" data-testid="home-role-select-wrapper">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Select access type</p>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger
                    data-testid="home-role-select"
                    className="h-10 border-slate-800 bg-slate-950/80 text-sm transition-colors duration-200 focus-visible:ring-emerald-500"
                  >
                    <SelectValue
                      placeholder="Choose role"
                      data-testid="home-role-select-value"
                    />
                  </SelectTrigger>
                  <SelectContent className="border-slate-800 bg-slate-950 text-slate-50">
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
                <p
                  className="text-xs text-slate-400"
                  data-testid="home-role-description"
                >
                  {selectedRole === "super_admin" && "Full visibility across all companies, branches and users."}
                  {selectedRole === "admin" && "Focused view of your own company or branch team."}
                  {selectedRole === "user" && "Personal dashboard for your own activity and profile."}
                </p>
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
