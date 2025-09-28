'use client';

/**
 * Sidebar loading skeleton component
 * Following Single Responsibility Principle - only handles loading state
 */
export function SidebarLoading() {
  const skeletonItems = Array.from({ length: 5 }, (_, index) => index + 1);

  return (
    <div className="space-y-2">
      {skeletonItems.map((index) => (
        <LoadingSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Individual loading skeleton item
 * Following DRY principle - reusable skeleton component
 */
function LoadingSkeleton() {
  return (
    <div className="px-4 py-3 rounded-xl bg-accent/20 animate-pulse">
      <div className="flex items-center space-x-3">
        <SkeletonIcon />
        <SkeletonContent />
      </div>
    </div>
  );
}

/**
 * Skeleton icon placeholder
 * Following Single Responsibility Principle
 */
function SkeletonIcon() {
  return (
    <div className="w-8 h-8 bg-accent/30 rounded-lg" />
  );
}

/**
 * Skeleton content placeholder (label and description)
 * Following Single Responsibility Principle
 */
function SkeletonContent() {
  return (
    <div className="flex-1">
      <div className="h-4 bg-accent/30 rounded mb-1" />
      <div className="h-3 bg-accent/20 rounded w-3/4" />
    </div>
  );
}