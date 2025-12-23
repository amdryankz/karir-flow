"use client";

import { useSession } from "@/lib/authClient";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Briefcase,
  FileCheck,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/dashboard", {
      headers: {
        "x-user-id": session.user.id,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Could not load dashboard data");
      })
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Card className="border-none shadow-md rounded-2xl">
            <CardContent className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2 text-[#5e6d55] dark:text-zinc-400">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#14a800] border-t-transparent" />
                <p>Loading dashboard...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const kpi = data?.kpi || {
    totalInterviews: 0,
    avgScore: 0,
    totalApplications: 0,
  };
  const charts = data?.charts || { scoreTrend: [] };
  const recentActivity = data?.recentActivity || [];

  return (
    <motion.div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div className="space-y-6" variants={itemVariants}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-[#001e00] dark:text-zinc-100 tracking-tight">
                Dashboard Overview
              </h1>
              <p className="text-[#5e6d55] dark:text-zinc-400">
                Welcome back, {userName}! Here`s your career progress at a
                glance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 rounded-full border-[#e4ebe4] dark:border-zinc-700"
              >
                <Calendar className="h-4 w-4" />
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          className="grid gap-4 md:grid-cols-3"
          variants={itemVariants}
        >
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
            change={
              kpi.avgScore > 80
                ? "Excellent"
                : kpi.avgScore > 60
                ? "Good"
                : "Needs Work"
            }
            icon={Target}
          />
          <KPI_Card
            title="Applications Tracked"
            value={kpi.totalApplications}
            trend="neutral"
            icon={Briefcase}
          />
        </motion.div>

        <motion.div
          className="grid gap-4 md:grid-cols-7"
          variants={itemVariants}
        >
          {/* Main Chart Area */}
          <Card className="col-span-1 md:col-span-4 border-none shadow-md rounded-2xl">
            <CardHeader className="border-b border-[#e4ebe4] dark:border-zinc-800 pb-6">
              <CardTitle className="text-xl font-bold text-[#001e00] dark:text-zinc-100">
                Performance Trends
              </CardTitle>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                Score history for last 5 sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[250px] w-full flex items-end justify-between gap-4">
                {charts.scoreTrend.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-[#5e6d55] dark:text-zinc-400">
                    No data available
                  </div>
                ) : (
                  charts.scoreTrend.map((item: any, i: number) => (
                    <ChartBar
                      key={i}
                      label={item.date.split(",")[0]} // Simple date format
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
          <Card className="col-span-1 md:col-span-3 border-none shadow-md rounded-2xl">
            <CardHeader className="border-b border-[#e4ebe4] dark:border-zinc-800 pb-6">
              <CardTitle className="text-xl font-bold text-[#001e00] dark:text-zinc-100">
                Recent Activity
              </CardTitle>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                Latest interviews and applications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                    No recent activity found.
                  </p>
                ) : (
                  recentActivity.map((act: any) => (
                    <ActivityItem
                      key={act.type + act.id}
                      title={
                        act.type === "interview"
                          ? "Interview Completed"
                          : "Offer Letter Added"
                      }
                      time={new Date(act.date).toLocaleDateString()}
                      desc={
                        act.type === "interview"
                          ? `${act.title} - Score: ${act.score || "-"}`
                          : `${act.title} - Status: ${act.status}`
                      }
                    />
                  ))
                )}
              </div>
              <div className="mt-6 space-y-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start rounded-full border-[#e4ebe4] dark:border-zinc-700 hover:bg-[#f9f9f9] dark:hover:bg-zinc-800/50"
                >
                  <Link href="/practice-interview">
                    <FileCheck className="mr-2 h-4 w-4" /> View Interviews
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start rounded-full border-[#e4ebe4] dark:border-zinc-700 hover:bg-[#f9f9f9] dark:hover:bg-zinc-800/50"
                >
                  <Link href="/check-offering">
                    <FileText className="mr-2 h-4 w-4" /> View Offer Letters
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function KPI_Card({ title, value, change, trend, icon: Icon }: any) {
  return (
    <Card className="border-none shadow-md rounded-2xl bg-white dark:bg-zinc-900 transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#5e6d55] dark:text-zinc-400">
          {title}
        </CardTitle>
        <div className="p-2 rounded-xl bg-[#14a800]/10">
          <Icon className="h-4 w-4 text-[#14a800]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#001e00] dark:text-zinc-100">
          {value}
        </div>
        {change && (
          <p className="text-xs flex items-center gap-1 mt-1">
            {trend === "up" && (
              <ArrowUpRight className="h-3 w-3 text-[#14a800]" />
            )}
            {trend === "down" && (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span
              className={
                trend === "up"
                  ? "text-[#14a800]"
                  : trend === "down"
                  ? "text-red-600"
                  : "text-[#5e6d55] dark:text-zinc-400"
              }
            >
              {change}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ChartBar({ label, height, value, highlight }: any) {
  return (
    <div className="flex flex-col items-center justify-end h-full w-full gap-2 group cursor-default">
      <div className="relative w-full flex items-end justify-center h-full">
        <div
          className={`w-full rounded-t-lg transition-all duration-500 group-hover:opacity-80 ${
            highlight ? "bg-[#14a800]" : "bg-[#e4ebe4] dark:bg-zinc-700"
          }`}
          style={{ height: height }}
        ></div>
        {/* Tooltip-like value */}
        <span className="absolute -top-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-[#001e00] dark:bg-zinc-100 text-white dark:text-zinc-900 px-2 py-0.5 rounded shadow-sm">
          {value}
        </span>
      </div>
      <span className="text-xs text-[#5e6d55] dark:text-zinc-400 font-medium truncate w-16 text-center">
        {label}
      </span>
    </div>
  );
}

function ActivityItem({ title, time, desc }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative mt-1 h-2 w-2 rounded-full bg-[#14a800]/60 ring-4 ring-[#14a800]/10" />
      <div className="space-y-1">
        <p className="text-sm font-medium leading-none text-[#001e00] dark:text-zinc-100">
          {title}
        </p>
        <p className="text-sm text-[#5e6d55] dark:text-zinc-400">{desc}</p>
        <p className="text-xs text-[#5e6d55]/60 dark:text-zinc-400/60">
          {time}
        </p>
      </div>
    </div>
  );
}
