'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';
import { getMenuItemsForRole } from './sidebar/menu-config';
import { SidebarMenuItem } from './sidebar/sidebar-menu-item';
import { SidebarLoading } from './sidebar/sidebar-loading';
import { SidebarFooter } from './sidebar/sidebar-footer';


/**
 * Refactored Sidebar component following SOLID principles
 *
 * Single Responsibility: Only handles sidebar layout and state
 * Open/Closed: Easy to extend with new menu items via config
 * Liskov Substitution: Components implement clear interfaces
 * Interface Segregation: Each component has focused interface
 * Dependency Inversion: Depends on abstractions, not implementations
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user, sidebarOpen, setSidebarOpen } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  // Wait for user to load
  useEffect(() => {
    if (user !== null) {
      setIsLoading(false);
    }
  }, [user]);

  const userRole = user?.role || null;
  const menuItems = userRole ? getMenuItemsForRole(userRole) : [];

  // Debug logging (can be removed in production)
  console.log('🔍 Sidebar Debug:', {
    isLoading,
    user,
    userRole,
    userRoleFromUser: user?.role,
    hasValidRole: !!userRole,
    itemsCount: menuItems?.length || 0,
    itemsRaw: menuItems
  });

  return (
    <>
      <SidebarOverlay
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <SidebarContainer isOpen={sidebarOpen}>
        <SidebarCloseButton onClose={() => setSidebarOpen(false)} />

        <SidebarNavigation
          isLoading={isLoading}
          hasUser={!!user}
          menuItems={menuItems}
          currentPath={pathname}
          onItemClick={() => setSidebarOpen(false)}
        />

        <SidebarFooter />
      </SidebarContainer>
    </>
  );
}

/**
 * Mobile overlay component
 * Following Single Responsibility Principle
 */
function SidebarOverlay({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
      onClick={onClose}
    />
  );
}

/**
 * Main sidebar container
 * Following Single Responsibility Principle
 */
function SidebarContainer({
  isOpen,
  children
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <aside
      className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-72 glass-morphism border-r border-border/40 transform transition-all duration-300 lg:transform-none',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      <div className="flex flex-col h-full animate-slide-in">
        {children}
      </div>
    </aside>
  );
}

/**
 * Mobile close button component
 * Following Single Responsibility Principle
 */
function SidebarCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <div className="lg:hidden flex justify-end p-4">
      <button
        onClick={onClose}
        className="p-2 rounded-xl hover:bg-accent/50 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

/**
 * Navigation section component
 * Following Single Responsibility Principle
 */
function SidebarNavigation({
  isLoading,
  hasUser,
  menuItems,
  currentPath,
  onItemClick
}: {
  isLoading: boolean;
  hasUser: boolean;
  menuItems: any[];
  currentPath: string;
  onItemClick: () => void;
}) {
  return (
    <nav className="flex-1 px-4 pt-2 lg:pt-6 space-y-2 scrollbar-modern overflow-y-auto">
      {isLoading || !hasUser ? (
        <SidebarLoading />
      ) : (
        <SidebarMenuList
          items={menuItems}
          currentPath={currentPath}
          onItemClick={onItemClick}
        />
      )}
    </nav>
  );
}

/**
 * Menu list component
 * Following Single Responsibility Principle
 */
function SidebarMenuList({
  items,
  currentPath,
  onItemClick
}: {
  items: any[];
  currentPath: string;
  onItemClick: () => void;
}) {
  return (
    <>
      {items.map((item) => (
        <SidebarMenuItem
          key={item.href}
          item={item}
          currentPath={currentPath}
          onItemClick={onItemClick}
        />
      ))}
    </>
  );
}