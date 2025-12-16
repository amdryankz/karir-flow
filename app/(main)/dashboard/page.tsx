"use client";

import { useSession } from "@/lib/authClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Briefcase,
  FileCheck,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/dashboard", {
      headers: {
        "x-user-id": session.user.id
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        console.error(err);
        toast.error("Could not load dashboard data");
      })
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
         <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p>Loading dashboard...</p>
         </div>
      </div>
    );
  }

  const kpi = data?.kpi || { totalInterviews: 0, avgScore: 0, totalApplications: 0 };
  const charts = data?.charts || { scoreTrend: [] };
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 font-sans bg-background min-h-screen text-foreground transition-colors duration-300">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back, {userName}! Here's your career progress at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPI_Card 
          title="Total Interviews" 
          value={kpi.totalInterviews} 
          trend="neutral"
          icon={Users}
        />
        <KPI_Card 
          title="Avg. Score" 
          value={kpi.avgScore > 0 ? `${kpi.avgScore}/100` : "-"} 
          trend="up"
          change={kpi.avgScore > 80 ? "Excellent" : kpi.avgScore > 60 ? "Good" : "Needs Work"}
          icon={Target}
        />
        <KPI_Card 
          title="Applications Tracked" 
          value={kpi.totalApplications} 
          trend="neutral"
          icon={Briefcase}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Main Chart Area */}
        <Card className="col-span-1 md:col-span-4 border-none shadow-md bg-card">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Score history for last 5 sessions</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="h-[250px] w-full flex items-end justify-between gap-4 pt-4">
              {charts.scoreTrend.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No data available
                 </div>
              ) : (
                charts.scoreTrend.map((item: any, i: number) => (
                  <ChartBar 
                    key={i} 
                    label={item.date.split(',')[0]} // Simple date format
                    height={`${item.score}%`} 
                    value={item.score} 
                    highlight={i === charts.scoreTrend.length - 1} 
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel: Recent Activity */}
        <Card className="col-span-1 md:col-span-3 border-none shadow-md bg-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest interviews and applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.length === 0 ? (
                 <p className="text-sm text-muted-foreground">No recent activity found.</p>
              ) : (
                 recentActivity.map((act: any) => (
                    <ActivityItem 
                      key={act.type + act.id}
                      title={act.type === 'interview' ? 'Interview Completed' : 'Offer Letter Added'}
                      time={new Date(act.date).toLocaleDateString()}
                      desc={act.type === 'interview' 
                            ? `${act.title} - Score: ${act.score || '-'}` 
                            : `${act.title} - Status: ${act.status}`}
                    />
                 ))
              )}
            </div>
            <div className="mt-6 space-y-2">
               <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/practice-interview">
                    <FileCheck className="mr-2 h-4 w-4" /> View Interviews
                  </Link>
               </Button>
               {/* Assuming there is a route for offers, otherwise button connects to upload-offering or similar */}
                {/* Check directory list again, it said `offering` but user state has `upload-offering` and `check-offering` */}
               <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/check-offering"> 
                     <FileText className="mr-2 h-4 w-4" /> View Offer Letters
                  </Link>
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPI_Card({ title, value, change, trend, icon: Icon }: any) {
  return (
    <Card className="border-none shadow-sm bg-card transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
            <span className={trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : ""}>
                {change}
            </span>
            </p>
        )}
      </CardContent>
    </Card>
  )
}

function ChartBar({ label, height, value, highlight }: any) {
    return (
        <div className="flex flex-col items-center justify-end h-full w-full gap-2 group cursor-default">
            <div className="relative w-full flex items-end justify-center h-full">
                <div 
                    className={`w-full rounded-t-sm transition-all duration-500 group-hover:opacity-80 ${highlight ? 'bg-primary' : 'bg-muted'}`}
                    style={{ height: height }}
                >
                </div>
                 {/* Tooltip-like value */}
                 <span className="absolute -top-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background px-2 py-0.5 rounded shadow-sm">
                    {value}
                 </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium truncate w-16 text-center">{label}</span>
        </div>
    )
}

function ActivityItem({ title, time, desc }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className="relative mt-1 h-2 w-2 rounded-full bg-primary/40 ring-4 ring-primary/10" />
            <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
                 <p className="text-xs text-muted-foreground/60">{time}</p>
            </div>
        </div>
    )
}
