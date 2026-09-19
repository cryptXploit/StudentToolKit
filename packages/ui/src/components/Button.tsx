import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl active:scale-[0.98] transition-transform transition-colors';
    
    let variantStyles = '';
    switch (variant) {
      case 'primary':
        variantStyles = 'bg-primary text-white hover:bg-blue-700';
        break;
      case 'secondary':
        variantStyles = 'bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 dark:hover:bg-slate-700';
        break;
      case 'danger':
        variantStyles = 'bg-red-500 text-white hover:bg-red-600';
        break;
      case 'ghost':
        variantStyles = 'bg-transparent text-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground';
        break;
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
