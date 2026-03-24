import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'warm';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  size = 'md',
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
