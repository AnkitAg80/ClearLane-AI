import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils/cn';

interface KineticHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  level?: 'hero' | 'section' | 'subsection';
}

export function KineticHeading({ as: Tag = 'h1', level = 'hero', className, children, ...props }: KineticHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Tag
        className={cn(
          'tracking-tight',
          {
            'text-3xl font-bold md:text-4xl lg:text-5xl': level === 'hero',
            'text-2xl font-bold': level === 'section',
            'text-lg font-semibold': level === 'subsection',
          },
          className,
        )}
        {...props}
      >
        {children}
      </Tag>
    </motion.div>
  );
}
