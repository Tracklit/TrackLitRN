import React from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: {
    name: string;
    href: string;
  }[];
  className?: string;
}

export function PageContainer({
  children,
  title,
  breadcrumbs = [],
  className,
}: PageContainerProps) {
  return (
    <div className={cn("container px-4 pt-6 pb-3 md:pt-8 md:pb-4", className)}>
      {breadcrumbs.length > 0 && <Breadcrumb segments={breadcrumbs} />}
      
      {title && (
        <h1 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {title}
        </h1>
      )}
      
      {children}
    </div>
  );
}