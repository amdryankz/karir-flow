"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/authClient";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Loader2,
  Plus,
  ExternalLink,
  Trash2,
  Upload,
  Calendar,
} from "lucide-react";
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
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch offerings"
          );
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-background p-4 md:p-6 font-sans transition-colors duration-300">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-10 w-64 rounded-lg" />
              <Skeleton className="h-4 w-96 rounded" />
            </div>
            <Skeleton className="h-10 w-48 rounded-full" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="border-none shadow-sm bg-card rounded-xl"
              >
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-24 rounded mb-2" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-sm bg-card rounded-xl overflow-hidden">
            <CardHeader className="border-b bg-muted/30 px-6 py-4">
              <Skeleton className="h-6 w-40 rounded-lg" />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                  </div>
                  <Skeleton className="h-9 w-20 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-background p-4 md:p-6 font-sans transition-colors duration-300">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Offer Letters
              </h1>
              <p className="text-muted-foreground">
                Manage and analyze your job offers
              </p>
            </div>
            <Button
              onClick={() => router.push("/upload-offering")}
              className="rounded-full shadow-sm w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" /> Upload Offer
            </Button>
          </div>
          <Card className="border-red-200/50 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30 shadow-sm rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3 mb-4">
                <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                Failed to Load Offers
              </h3>
              <p className="text-red-600 dark:text-red-400 max-w-md">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="mt-6 rounded-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-full bg-background p-4 md:p-6 font-sans text-foreground transition-colors duration-300"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
          variants={itemVariants}
        >
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Offer Letters
            </h1>
            <p className="text-muted-foreground">
              {offerings.length === 0
                ? "Get AI-powered insights on your job offers"
                : `Manage and compare your job offers`}
            </p>
          </div>
          <Button
            onClick={() => router.push("/upload-offering")}
            className="h-10 rounded-full px-6 font-medium shadow-sm transition-all hover:shadow-md w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Upload Offer
          </Button>
        </motion.div>

        {/* Offer Letters List */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-none shadow-sm bg-card rounded-xl">
            <CardHeader className="border-b bg-muted/30 px-6 py-5">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Your Offers
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Review and compare your job offer letters
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {offerings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-6">
                    <Upload className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Ready to Analyze Your Offers?
                  </h3>
                  <p className="mb-6 max-w-md text-muted-foreground leading-relaxed">
                    Upload your offer letters to get AI-powered insights about
                    compensation, benefits, and career growth opportunities.
                  </p>
                  <Button
                    onClick={() => router.push("/upload-offering")}
                    className="rounded-full shadow-sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Upload First Offer Letter
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="w-[60px] px-6 py-4 font-semibold text-foreground">
                          #
                        </TableHead>
                        <TableHead className="py-4 font-semibold text-foreground min-w-[200px]">
                          Job Title
                        </TableHead>
                        <TableHead className="py-4 font-semibold text-foreground">
                          Status
                        </TableHead>
                        <TableHead className="py-4 font-semibold text-foreground">
                          Document
                        </TableHead>
                        <TableHead className="py-4 font-semibold text-foreground">
                          Upload Date
                        </TableHead>
                        <TableHead className="px-6 py-4 text-right font-semibold text-foreground min-w-[100px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offerings.map((offer, index) => (
                        <TableRow
                          key={offer.id}
                          className="cursor-pointer hover:bg-muted/40 transition-colors border-b"
                          onClick={() => handleRowClick(offer.id)}
                        >
                          <TableCell className="px-6 py-5 font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="font-medium text-foreground line-clamp-1">
                              {offer.title}
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <Badge
                              variant="outline"
                              className={
                                offer.status === "analyzed"
                                  ? "bg-green-50 text-green-700 border-green-200 rounded-full px-3 py-1 font-medium dark:bg-green-950/30 dark:text-green-400 dark:border-green-900 capitalize"
                                  : "bg-amber-50 text-amber-700 border-amber-200 rounded-full px-3 py-1 font-medium dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900 capitalize"
                              }
                            >
                              {offer.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleFileClick(e, offer.fileUrl)}
                              className="h-auto p-0 hover:bg-transparent text-primary hover:underline font-medium"
                            >
                              <FileText className="h-4 w-4 mr-1.5" />
                              View PDF
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </TableCell>
                          <TableCell className="py-5 text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(offer.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="px-6 py-5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => openDelete(e, offer.id)}
                              className="rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
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
            </CardContent>
          </Card>
        </motion.div>

        <AlertDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && closeDelete()}
        >
          <AlertDialogContent className="rounded-2xl border-none shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">
                Delete Offer Letter?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. This will permanently delete the
                offer letter and all associated analysis.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} className="rounded-full">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-full bg-red-600 hover:bg-red-700"
              >
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
    </motion.div>
  );
}
