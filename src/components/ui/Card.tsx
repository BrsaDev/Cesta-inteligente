import React from 'react';
import { cn } from '@/src/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, children, hoverable, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-3xl bg-white p-5 shadow-sm border border-slate-100 transition-all',
        hoverable && 'hover:shadow-md hover:-translate-y-1 cursor-pointer active:scale-[0.98]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
