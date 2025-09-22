"use client";

import { useState, useEffect } from "react";

interface DateFormatterProps {
  date: string;
  fallback?: string;
  className?: string;
}

export function DateFormatter({
  date,
  fallback = "-",
  className,
}: DateFormatterProps) {
  const [mounted, setMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState(fallback);

  useEffect(() => {
    setMounted(true);
    if (date) {
      try {
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          setFormattedDate(dateObj.toLocaleString());
        } else {
          setFormattedDate(fallback);
        }
      } catch {
        setFormattedDate(fallback);
      }
    } else {
      setFormattedDate(fallback);
    }
  }, [date, fallback]);

  if (!mounted) {
    return <span className={className}>{fallback}</span>;
  }

  return <span className={className}>{formattedDate}</span>;
}

export function useSafeDate(date: string, fallback: string = "-") {
  const [mounted, setMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState(fallback);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && date) {
      try {
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          setFormattedDate(dateObj.toLocaleString());
        } else {
          setFormattedDate(fallback);
        }
      } catch {
        setFormattedDate(fallback);
      }
    }
  }, [mounted, date, fallback]);

  return { formattedDate, mounted };
}
