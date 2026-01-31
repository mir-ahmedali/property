import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

export function UserDashboard() {
  const { token, user: authUser } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`${backendUrl}/api/dashboard/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    };
    if (token) fetchData();
  }, [token]);

  const user = data?.user || authUser;

  if (!user) {
    return (
      <div
        className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-950 text-slate-100"
        data-testid="user-dashboard-loading"
      >
        Loading user dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-3xl space-y-6" data-testid="user-dashboard">
        <h1 className="text-2xl font-semibold">My dashboard</h1>
        <Card className="border-slate-800 bg-slate-900/80" data-testid="user-profile-card">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-200">
            <div data-testid="user-name">Name: {user.full_name}</div>
            <div data-testid="user-email">Email: {user.email}</div>
            <div data-testid="user-role">Role: {user.role}</div>
            <div data-testid="user-status">
              Status: {user.is_verified ? (
                <span className="font-medium text-emerald-400">Verified</span>
              ) : (
                <span className="font-medium text-amber-400">Pending approval by Super Admin</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
