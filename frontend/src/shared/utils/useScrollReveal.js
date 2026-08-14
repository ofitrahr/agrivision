import { useEffect, useRef } from 'react';

const useScrollReveal = (options = {}) => {
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = options;
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      element.classList.add('revealed');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('revealed');
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return ref;
};

export default useScrollReveal;
