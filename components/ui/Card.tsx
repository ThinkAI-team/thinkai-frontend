import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  variant?: 'default' | 'large' | 'glass';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ 
  variant = 'default', 
  children, 
  className = '',
  onClick 
}: CardProps) {
  return (
    <div 
      className={`${styles.card} ${styles[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
