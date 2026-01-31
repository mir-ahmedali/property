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
          <div
            className="grid gap-4 md:grid-cols-3"
            data-testid="properties-list"
          >
            {properties.map((p) => (
              <Card
                key={p.id}
                className="group flex cursor-pointer flex-col border-slate-800 bg-slate-900/70 hover:border-emerald-500/60"
                data-testid="property-card"
                onClick={() => navigate(`/properties/${p.id}`)}
              >
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-medium uppercase tracking-wide text-emerald-400">{p.city}</div>
                    <span
                      data-testid="property-status-badge"
                      className="rounded-full bg-slate-800 px-2 py-0.5 text-xs capitalize text-slate-200"
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="mb-1 text-sm font-semibold text-white" data-testid="property-title">
                    {p.title}
                  </div>
                  <div className="mb-2 text-xs text-slate-400" data-testid="property-type">
                    {p.property_type}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="text-sm font-semibold text-emerald-400" data-testid="property-price">
                      ₹ {p.price?.toLocaleString?.("en-IN") ?? p.price}
                    </div>
                    <button
                      type="button"
                      data-testid="property-view-button"
                      className="text-xs font-medium text-emerald-300 underline-offset-2 hover:text-emerald-200 hover:underline"
                    >
                      View details
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {properties.length === 0 && (
              <div
                className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400"
                data-testid="no-properties-message"
              >
                No properties found yet. Franchise owners can add properties from their dashboard.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
