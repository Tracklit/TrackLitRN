import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

export function ListSkeleton({ 
  items = 3, 
  showAvatar = true,
  className = ""
}: ListSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center py-4 px-4 border-b border-gray-800 last:border-b-0">
          {showAvatar && (
            <Skeleton className="h-7 w-7 rounded-full mr-4 flex-shrink-0" />
          )}
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}