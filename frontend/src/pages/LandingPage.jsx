import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

export function LandingPage() {
  const [properties, setProperties] = useState([]);
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProps = async () => {
      const res = await axios.get(`${backendUrl}/api/properties`, {
        params: {
          city: city || undefined,
          type: type || undefined,
          max_price: maxPrice || undefined,
        },
      });
      setProperties(res.data);
    };
    fetchProps();
  }, [city, type, maxPrice]);

  const goToDashboard = () => {
    if (!user) return;
    if (user.role === "customer") navigate("/dashboard/customer");
    else if (user.role === "agent") navigate("/dashboard/agent");
    else if (user.role === "franchise_owner") navigate("/dashboard/franchise");
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
              <p className="text-xs text-slate-400">Secure access for Super Admin, Admin & User</p>
            </div>
          </div>
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

              <div className="space-y-4" data-testid="home-role-hints">
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Super Admin</span>
                  <span className="text-xs text-slate-300">Full system control</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Admin</span>
                  <span className="text-xs text-slate-300">Own company / branch</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">User</span>
                  <span className="text-xs text-slate-300">Personal dashboard only</span>
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-slate-500" data-testid="home-login-info">
                Use your email & password to login. New users can register from the link below; Super Admin will approve
                their access.
              </div>

              <div className="flex justify-center">
                <Link to="/login" data-testid="home-login-link">
                  <Button className="rounded-full bg-emerald-600 px-6 text-sm font-medium text-white hover:bg-emerald-700">
                    Go to login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Legacy property sections removed for this simplified login-focused home */}
    </div>
  );
}
