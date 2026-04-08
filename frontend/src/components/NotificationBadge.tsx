'use client';

import { useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

interface NotificationBadgeProps {
  count: number;
}

export default function NotificationBadge({ count }: Readonly<NotificationBadgeProps>) {
  const controls = useAnimation();
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current && count > 0) {
      controls.start({
        scale: [1, 1.4, 0.9, 1.15, 1],
        transition: { duration: 0.45, ease: 'easeInOut' },
      });
    }
    prevCount.current = count;
  }, [count, controls]);

  return (
    <button
      className="relative inline-flex items-center justify-center rounded-full p-2 text-muted hover:bg-off hover:text-ink transition-colors"
      aria-label={count > 0 ? `Notifications (${count})` : 'Notifications'}
    >
      <Bell className="h-5 w-5" />

      {count > 0 && (
        <motion.span
          animate={controls}
          className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-red px-1 font-display text-[10px] font-bold leading-none text-white"
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </button>
  );
}
