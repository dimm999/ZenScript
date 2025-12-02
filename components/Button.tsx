import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  label?: string;
}

export const Button: React.FC<ButtonProps> = ({ active, icon, label, className = '', ...props }) => {
  return (
    <button
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ease-out
        hover:bg-black/5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black/5
        ${active ? 'bg-black/10 font-medium' : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="w-5 h-5 flex items-center justify-center">{icon}</span>}
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
};
