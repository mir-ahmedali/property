import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

export function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`${backendUrl}/api/dashboard/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    };
    if (token) fetchData();
  }, [token]);

  if (!data) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100"
        data-testid="admin-dashboard-loading"
      >
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-5xl space-y-6" data-testid="admin-dashboard">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <Card className="border-slate-800 bg-slate-900/80" data-testid="admin-company-card">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">Company / Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-200" data-testid="admin-company-id">
              Company ID: {data.company_id || "Not set"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/80" data-testid="admin-team-card">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">Team members</CardTitle>
          </CardHeader>
          <CardContent>
            {data.team_members.length === 0 ? (
              <p className="text-sm text-slate-400" data-testid="admin-no-team-members">
                No team members linked to this company yet.
              </p>
            ) : (
              <ul className="space-y-2" data-testid="admin-team-list">
                {data.team_members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between text-sm text-slate-200"
                    data-testid="admin-team-member-item"
                  >
                    <span>{member.full_name}</span>
                    <span className="text-xs text-slate-400">{member.email}</span>
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
