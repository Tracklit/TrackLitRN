import { Skeleton } from "@/components/ui/skeleton";

interface CardSkeletonProps {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showMeta?: boolean;
  className?: string;
}

export function CardSkeleton({ 
  showImage = true, 
  showTitle = true, 
  showDescription = true, 
  showMeta = true,
  className = ""
}: CardSkeletonProps) {
  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      {showImage && (
        <Skeleton className="h-32 w-full mb-4" />
      )}
      {showTitle && (
        <Skeleton className="h-6 w-3/4 mb-2" />
      )}
      {showDescription && (
        <Skeleton className="h-4 w-full mb-2" />
      )}
      {showDescription && (
        <Skeleton className="h-4 w-2/3 mb-3" />
      )}
      {showMeta && (
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      )}
    </div>
  );
}