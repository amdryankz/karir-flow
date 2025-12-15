"use client"

import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import React from "react"
import { useSession } from "@/lib/authClient"

const routeNameMap: Record<string, string> = {
  "dashboard": "Dashboard",
  "job-recommendation": "Job Recommendation",
  "practice-interview": "Practice Interview",
  "check-offering": "Check Offering",
  "profile": "Profile"
}

export function HeaderBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const { data: session } = useSession()

  // Detect /check-offering/[id] and fetch title for dynamic breadcrumb
  const offeringId = useMemo(() => {
    const idx = segments.findIndex((s) => s === "check-offering")
    if (idx !== -1 && segments[idx + 1]) return segments[idx + 1]
    return null
  }, [segments])

  const [offeringTitle, setOfferingTitle] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchTitle() {
      if (!offeringId || !session?.user?.id) return
      try {
        const res = await fetch(`/api/offering/${offeringId}`, {
          headers: { "x-user-id": session.user.id },
        })
        if (!res.ok) return
        const json = await res.json().catch(() => ({} as any))
        const data = json?.data ?? json
        const title = data?.title as string | undefined
        if (!cancelled && title) setOfferingTitle(title)
      } catch {
        // Silent fail; fallback to id
      }
    }
    fetchTitle()
    return () => {
      cancelled = true
    }
  }, [offeringId, session?.user?.id])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/dashboard">Karir Flow</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const href = `/${segments.slice(0, index + 1).join("/")}`
          
          // Format the segment name: use map or capitalize
          let name = routeNameMap[segment] || segment.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")

          // If this segment is the dynamic offering id, replace with fetched title when available
          const prev = segments[index - 1]
          if (prev === "check-offering" && offeringId === segment) {
            name = offeringTitle || name
          }

          return (
            <React.Fragment key={href}>
              <BreadcrumbItem className="hidden md:block">
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
