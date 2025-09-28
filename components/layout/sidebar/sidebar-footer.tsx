'use client';

import { TrendingUp } from 'lucide-react';

interface SidebarFooterProps {
  version?: string;
  productName?: string;
}

/**
 * Sidebar footer component
 * Following Single Responsibility Principle - only handles footer content
 */
export function SidebarFooter({
  version = 'v2.0.0',
  productName = '교권119'
}: SidebarFooterProps) {
  return (
    <div className="border-t border-border/40 p-6">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <ProductInfo productName={productName} version={version} />
        <CopyrightInfo />
      </div>
    </div>
  );
}

/**
 * Product information section
 * Following Single Responsibility Principle
 */
function ProductInfo({
  productName,
  version
}: {
  productName: string;
  version: string;
}) {
  return (
    <div>
      <p className="font-semibold">{productName}</p>
      <VersionDisplay version={version} />
    </div>
  );
}

/**
 * Version display with trending icon
 * Following Single Responsibility Principle
 */
function VersionDisplay({ version }: { version: string }) {
  return (
    <p className="flex items-center gap-1 mt-1">
      {version}
      <TrendingUp className="h-3 w-3 text-trust-500" />
    </p>
  );
}

/**
 * Copyright information section
 * Following Single Responsibility Principle
 */
function CopyrightInfo() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="text-right">
      <p>© {currentYear}</p>
      <p className="text-trust-600 dark:text-trust-400 font-medium">
        교권보호
      </p>
    </div>
  );
}