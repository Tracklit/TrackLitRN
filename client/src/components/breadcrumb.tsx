import React from 'react';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm mb-4" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />
          )}
          {index === items.length - 1 ? (
            <span className="text-muted-foreground" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link 
              href={item.href}
              className="text-primary hover:underline"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}