import { useEffect, useState, useRef } from 'react';

export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      
      // Increase threshold to prevent too sensitive detection
      if (Math.abs(scrollY - lastScrollY.current) < 10) {
        ticking = false;
        return;
      }
      
      const direction = scrollY > lastScrollY.current ? 'down' : 'up';
      setScrollDirection(direction);
      
      // More forgiving hide/show logic
      if (direction === 'down' && scrollY > 100) { // Increased threshold
        setIsVisible(false);
      } else if (direction === 'up' || scrollY < 50) { // Show when scrolling up or near top
        setIsVisible(true);
      }
      
      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }

      // Clear previous timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Show navbar after scroll stops
      scrollTimeout.current = setTimeout(() => {
        setIsVisible(true);
      }, 1000); // Show after 1 second of no scrolling
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return { scrollDirection, isVisible };
};