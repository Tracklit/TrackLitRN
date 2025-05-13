import * as React from "react"
import { ChevronRight, HomeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Link } from "wouter"

interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: {
    name: string
    href: string
  }[]
  separator?: React.ReactNode
  homeHref?: string
}

export function Breadcrumb({
  segments,
  separator = <ChevronRight className="h-4 w-4" />,
  homeHref = "/",
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center text-sm text-muted-foreground mb-4",
        className
      )}
      {...props}
    >
      <ol className="flex items-center space-x-2">
        <li>
          <Link href={homeHref} className="flex items-center hover:text-foreground transition-colors">
            <HomeIcon className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          return (
            <li key={segment.href} className="flex items-center space-x-2">
              <span className="mx-1 text-muted-foreground/50">{separator}</span>
              {index === segments.length - 1 ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {segment.name}
                </span>
              ) : (
                <Link
                  href={segment.href}
                  className="hover:text-foreground transition-colors"
                >
                  {segment.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  )
}