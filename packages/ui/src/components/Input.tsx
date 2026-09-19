import { InputHTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', icon: Icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-muted">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={`w-full bg-background border border-slate-200 dark:border-slate-700 rounded-lg py-2 text-foreground focus:outline-none focus:border-primary transition-colors ${
            Icon ? 'pl-10 pr-3' : 'px-3'
          } ${className}`}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
