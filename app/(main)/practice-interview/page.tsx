"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, RotateCcw } from "lucide-react"

const interviews = [
  {
    id: 1,
    title: "Frontend Developer Interview",
    date: "2023-10-25",
    status: "Completed",
    score: 85,
  },
  {
    id: 2,
    title: "Backend Developer Interview",
    date: "2023-10-26",
    status: "Pending",
    score: null,
  },
  {
    id: 3,
    title: "Fullstack Developer Interview",
    date: "2023-10-27",
    status: "Failed",
    score: 45,
  },
  {
    id: 4,
    title: "System Design Interview",
    date: "2023-10-28",
    status: "Completed",
    score: 92,
  },
]

export default function PracticeInterviewPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Practice Interview</h1>
        <Button asChild>
          <a href="/practice-interview/start">Start New Interview</a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((interview, index) => (
                <TableRow key={interview.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{interview.title}</TableCell>
                  <TableCell>{interview.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        interview.status === "Completed"
                          ? "bg-green-100/20 text-green-700 dark:text-green-300 border-green-300/30 dark:border-green-600/40"
                          : interview.status === "Pending"
                          ? "bg-yellow-100/20 text-yellow-700 dark:text-yellow-300 border-yellow-300/30 dark:border-yellow-600/40"
                          : "bg-red-100/20 text-red-700 dark:text-red-300 border-red-300/30 dark:border-red-600/40"
                      }
                    >
                      {interview.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {interview.score ? `${interview.score}/100` : "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" title="Replay Interview">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
