import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

export function FranchiseDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`${backendUrl}/api/dashboard/franchise`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    };
    if (token) fetchData();
  }, [token]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100" data-testid="franchise-dashboard-loading">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl space-y-6" data-testid="franchise-dashboard">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Franchise overview</h1>
          <div className="flex gap-2">
            <Button
              data-testid="franchise-add-property-button"
              className="rounded-full bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Add property
            </Button>
            <Button
              data-testid="franchise-add-agent-button"
              variant="outline"
              className="border-emerald-500/40 bg-slate-900/60 text-xs font-medium hover:bg-slate-900"
            >
              Add agent
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-slate-800 bg-slate-900/80" data-testid="franchise-total-properties">
            <CardHeader>
              <CardTitle className="text-xs text-slate-300">Total properties</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-white">{data.total_properties}</CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/80" data-testid="franchise-available-properties">
            <CardHeader>
              <CardTitle className="text-xs text-slate-300">Available</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-emerald-400">{data.available_properties}</CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/80" data-testid="franchise-booked-properties">
            <CardHeader>
              <CardTitle className="text-xs text-slate-300">Booked</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-amber-400">{data.booked_properties}</CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/80" data-testid="franchise-sold-properties">
            <CardHeader>
              <CardTitle className="text-xs text-slate-300">Sold</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-slate-200">{data.sold_properties}</CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/80" data-testid="franchise-total-booking-amount">
            <CardHeader>
              <CardTitle className="text-xs text-slate-300">Booking revenue (₹)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-emerald-400">
              {data.total_booking_amount?.toLocaleString?.("en-IN") ?? data.total_booking_amount}
            </CardContent>
          </Card>
        </div>
        <Card className="border-slate-800 bg-slate-900/80" data-testid="franchise-recent-leads-card">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">Recent leads</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recent_leads.length === 0 ? (
              <p className="text-sm text-slate-400" data-testid="franchise-no-leads-message">
                No leads yet.
              </p>
            ) : (
              <ul className="space-y-2" data-testid="franchise-leads-list">
                {data.recent_leads.map((lead) => (
                  <li
                    key={lead.id}
                    className="flex items-center justify-between text-sm text-slate-200"
                    data-testid="franchise-lead-item"
                  >
                    <span className="capitalize">{lead.type.replace("_", " ")}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-400">{lead.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
