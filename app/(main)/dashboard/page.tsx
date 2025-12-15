"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/authClient";
import { useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    // Keep as-is; guard handled in (main) layout if needed.
  }, [isPending, session, router]);

  if (isPending)
    return (
      <div className="p-6">
        <PageHeader title="Dashboard" description="Loading your data…" />
        <div className="mt-6 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Please wait…
        </div>
      </div>
    );

  if (!session?.user)
    return (
      <div className="p-6">
        <PageHeader title="Dashboard" description="Redirecting…" />
      </div>
    );

  const { user } = session;

  return (
    <div className="p-6">
      <PageHeader
        title="Welcome back"
        description="A quick overview of your account."
        actions={
          <Button variant="outline" onClick={() => router.push("/profile")}>
            <User2 className="mr-2 h-4 w-4" /> Profile
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              Account
            </h3>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="font-medium">{user.name || "User"}</div>
              <div className="text-muted-foreground">{user.email}</div>
            </div>
            <div className="mt-4">
              <Button variant="ghost" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              Next steps
            </h3>
            <div className="mt-3 grid gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">•</span> Upload or
                update your CV in Profile
              </div>
              <div>
                <span className="text-muted-foreground">•</span> Explore Job
                Recommendations
              </div>
              <div>
                <span className="text-muted-foreground">•</span> Try a Practice
                Interview
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/upload-cv")}
              >
                Upload CV
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/job-recommendation")}
              >
                Find jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
