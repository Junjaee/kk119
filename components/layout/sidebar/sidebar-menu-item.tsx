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
          'group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden',
          isActive
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
            : 'hover:bg-accent/50 text-foreground'
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
      'p-2 rounded-lg transition-all duration-200',
      isActive
        ? 'bg-white/30'
        : 'bg-accent/30 group-hover:bg-accent/50'
    )}>
      <Icon
        className={cn(
          'h-4 w-4 transition-all duration-200',
          isActive ? 'text-white' : '',
          isUrgent && !isActive && 'urgent-pulse'
        )}
        style={isActive ? { color: '#737373' } : {}}
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
      <p
        className="font-medium"
        style={isActive ? { color: '#737373' } : {}}
      >
        {item.label}
      </p>
      <p
        className={cn(
          'text-xs transition-colors font-medium',
          isActive ? 'text-white' : 'text-muted-foreground'
        )}
        style={isActive ? { color: '#737373', opacity: 1 } : {}}
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
      'px-2 py-1 text-xs font-semibold rounded-full',
      badgeColor
        ? `badge-${badgeColor}`
        : isActive
          ? 'bg-white/20 text-white'
          : 'bg-primary/10 text-primary'
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