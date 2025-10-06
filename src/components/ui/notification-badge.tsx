'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'error' | 'urgent';
type BadgeSize = 'sm' | 'md' | 'lg';
type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';

const getVariantClasses = (variant: BadgeVariant): string => {
  const variants = {
    default: 'bg-blue-500 text-white',
    info: 'bg-blue-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-500 text-white',
    urgent: 'bg-red-600 text-white animate-pulse',
  };
  return variants[variant];
};

const getSizeClasses = (size: BadgeSize): string => {
  const sizes = {
    sm: 'h-4 w-4 text-[10px] min-w-[16px]',
    md: 'h-5 w-5 text-xs min-w-[20px]',
    lg: 'h-6 w-6 text-sm min-w-[24px]',
  };
  return sizes[size];
};

const getPositionClasses = (position: BadgePosition): string => {
  const positions = {
    'top-right': 'absolute -top-1 -right-1',
    'top-left': 'absolute -top-1 -left-1',
    'bottom-right': 'absolute -bottom-1 -right-1',
    'bottom-left': 'absolute -bottom-1 -left-1',
    'inline': 'relative',
  };
  return positions[position];
};

export interface NotificationBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  position?: BadgePosition;
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  pulse?: boolean;
  dot?: boolean;
}

export function NotificationBadge({
  className,
  variant = 'default',
  size = 'sm',
  position = 'top-right',
  count = 0,
  maxCount = 99,
  showZero = false,
  pulse = false,
  dot = false,
  ...props
}: NotificationBadgeProps) {
  // Não mostrar se count é 0 e showZero é false
  if (count === 0 && !showZero) {
    return null;
  }

  // Determinar o texto a ser exibido
  const displayText = dot ? '' : count > maxCount ? `${maxCount}+` : count.toString();

  // Aplicar pulse se especificado ou se for urgent
  const shouldPulse = pulse || variant === 'urgent';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full text-xs font-medium transition-all duration-200',
        getVariantClasses(variant),
        getSizeClasses(size),
        getPositionClasses(position),
        shouldPulse && 'animate-pulse',
        dot && 'w-2 h-2 min-w-[8px]',
        className
      )}
      {...props}
    >
      {!dot && displayText}
    </span>
  );
}

// Componente wrapper para facilitar o uso com ícones
export interface BadgeWrapperProps {
  children: React.ReactNode;
  badge?: NotificationBadgeProps;
  className?: string;
}

export function BadgeWrapper({ children, badge, className }: BadgeWrapperProps) {
  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      {badge && <NotificationBadge {...badge} />}
    </div>
  );
}