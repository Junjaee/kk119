'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MenuItem, isMenuItemActive } from './menu-config';

interface SidebarMenuItemProps {
  item: MenuItem;
  currentPath: string;
  onItemClick: () => void;
}

/**
 * Individual sidebar menu item component
 * Following Single Responsibility Principle - only handles menu item rendering
 */
export function SidebarMenuItem({ item, currentPath, onItemClick }: SidebarMenuItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = isMenuItemActive(currentPath, item.href);
  const Icon = item.icon;

  return (
    <div className="relative">
      <Link
        href={item.href}
        className={cn(
          'group flex items-center justify-between px-4 py-3 rounded-md transition-colors duration-150 relative overflow-hidden focus-visible-ring',
          isActive
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm'
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-foreground'
        )}
        onClick={onItemClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <MenuItemContent
          icon={Icon}
          item={item}
          isActive={isActive}
        />

        <MenuItemActions
          item={item}
          isActive={isActive}
          isHovered={isHovered}
        />

        {/* Active indicator */}
        {isActive && <ActiveIndicator />}
      </Link>
    </div>
  );
}

/**
 * Menu item content (icon, label, description)
 * Following Single Responsibility Principle
 */
function MenuItemContent({
  icon: Icon,
  item,
  isActive
}: {
  icon: React.ComponentType<{ className?: string }>;
  item: MenuItem;
  isActive: boolean;
}) {
  return (
    <div className="flex items-center space-x-3">
      <MenuItemIcon Icon={Icon} isActive={isActive} isUrgent={item.isUrgent} />
      <MenuItemText item={item} isActive={isActive} />
    </div>
  );
}

/**
 * Menu item icon with styling
 * Following Single Responsibility Principle
 */
function MenuItemIcon({
  Icon,
  isActive,
  isUrgent
}: {
  Icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isUrgent?: boolean;
}) {
  return (
    <div className={cn(
      'p-2 rounded-sm transition-colors duration-150',
      isActive
        ? 'bg-white/20'
        : 'bg-neutral-100 dark:bg-neutral-800 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700'
    )}>
      <Icon
        className={cn(
          'h-4 w-4 transition-colors duration-150',
          isActive ? 'text-white' : 'text-muted-foreground',
          isUrgent && !isActive && 'animate-pulse'
        )}
      />
    </div>
  );
}

/**
 * Menu item text (label and description)
 * Following Single Responsibility Principle
 */
function MenuItemText({
  item,
  isActive
}: {
  item: MenuItem;
  isActive: boolean;
}) {
  return (
    <div>
      <p className={cn(
        'text-small font-medium',
        isActive ? 'text-white' : 'text-foreground'
      )}>
        {item.label}
      </p>
      <p
        className={cn(
          'text-caption transition-colors font-medium',
          isActive ? 'text-white/85' : 'text-muted-foreground'
        )}
      >
        {item.description}
      </p>
    </div>
  );
}

/**
 * Menu item actions (badge, chevron)
 * Following Single Responsibility Principle
 */
function MenuItemActions({
  item,
  isActive,
  isHovered
}: {
  item: MenuItem;
  isActive: boolean;
  isHovered: boolean;
}) {
  return (
    <div className="flex items-center space-x-2">
      {item.badge && (
        <MenuItemBadge
          badge={item.badge}
          badgeColor={item.badgeColor}
          isActive={isActive}
        />
      )}
      {isHovered && !isActive && (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

/**
 * Menu item badge
 * Following Single Responsibility Principle
 */
function MenuItemBadge({
  badge,
  badgeColor,
  isActive
}: {
  badge: string;
  badgeColor?: string;
  isActive: boolean;
}) {
  return (
    <span className={cn(
      'px-2 py-0.5 text-caption font-semibold rounded-full',
      badgeColor
        ? `badge-${badgeColor}`
        : isActive
          ? 'bg-white/20 text-white'
          : 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/40 dark:text-primary-200'
    )}>
      {badge}
    </span>
  );
}

/**
 * Active menu item indicator
 * Following Single Responsibility Principle
 */
function ActiveIndicator() {
  return (
    <div className="absolute left-0 top-0 w-1 h-full bg-white rounded-r-full" />
  );
}