import { HTMLAttributes, forwardRef, ElementType } from 'react';
import { LucideIcon } from 'lucide-react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message?: string;
  icon?: LucideIcon | ElementType;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'info', title, message, icon: Icon, children, ...props }, ref) => {
    let variantStyles = '';
    
    switch (variant) {
      case 'error':
        variantStyles = 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 border-red-200 dark:border-red-900/50';
        break;
      case 'warning':
        variantStyles = 'bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-900/50';
        break;
      case 'info':
        variantStyles = 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-900/50';
        break;
      case 'success':
        variantStyles = 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/50';
        break;
    }

    return (
      <div
        ref={ref}
        className={`border rounded-2xl p-4 flex items-start ${variantStyles} ${className}`}
        {...props}
      >
        {Icon && <Icon className="mr-3 mt-0.5 shrink-0" size={20} />}
        <div>
          {title && <h3 className="font-semibold text-sm mb-1">{title}</h3>}
          {message && <p className="text-sm opacity-90 leading-relaxed">{message}</p>}
          {children}
        </div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';
