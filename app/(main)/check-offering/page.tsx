"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Loader2, Plus, ExternalLink, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";

type OfferLetter = {
  id: string;
  userId: string;
  title: string;
  fileUrl: string;
  status: string;
  createdAt: string;
};

export default function CheckOfferingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [offerings, setOfferings] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchOfferings() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/offering", {
          headers: {
            "x-user-id": session?.user?.id || "",
          },
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(
            json.error || json.message || "Failed to fetch offerings"
          );
        }

        const json = await res.json();
        if (!cancelled) {
          setOfferings(json.data || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchOfferings();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const handleRowClick = (id: string) => {
    router.push(`/check-offering/${id}`);
  };

  const handleFileClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const closeDelete = () => setDeleteId(null);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/offering/${deleteId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": session?.user?.id || "",
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(
          json?.error || json?.message || "Failed to delete offer letter"
        );
      }
      setOfferings((prev) => prev.filter((o) => o.id !== deleteId));
      toast.success("Offer letter deleted");
      closeDelete();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Check Offering"
          description="Manage uploaded offer letters and view insights."
          actions={
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" /> Upload Offer Letter
            </Button>
          }
        />
        <div className="flex h-[200px] items-center justify-center rounded-md border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading offer letters...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Check Offering"
          description="Manage uploaded offer letters and view insights."
          actions={
            <Button onClick={() => router.push("/upload-offering")}>
              <Plus className="mr-2 h-4 w-4" /> Upload Offer Letter
            </Button>
          }
        />
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-destructive font-medium mb-2">
              Error loading data
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Check Offering"
        description="Manage uploaded offer letters and view insights."
        actions={
          <Button onClick={() => router.push("/upload-offering")}>
            <Plus className="mr-2 h-4 w-4" /> Upload Offer Letter
          </Button>
        }
      />

      {offerings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No offer letters yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
              Upload an offer letter to get AI-powered analysis and insights
              about your compensation package.
            </p>
            <Button onClick={() => router.push("/upload-offering")}>
              Upload First Offer Letter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead>Job Title / Company</TableHead>
                <TableHead>Uploaded File</TableHead>
                <TableHead className="text-right">Upload Date</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offerings.map((offer, index) => (
                <TableRow
                  key={offer.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(offer.id)}
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium">{offer.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {offer.status}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleFileClick(e, offer.fileUrl)}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                    >
                      <FileText className="h-4 w-4" />
                      View PDF
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {format(new Date(offer.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => openDelete(e, offer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && closeDelete()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job offer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
