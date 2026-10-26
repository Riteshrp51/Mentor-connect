import { createContext, useContext, useState, useEffect, useRef } from 'react';
import BrandLoader from '../components/BrandLoader';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const activeCountRef = useRef(0);
  const timerRef = useRef(null);

  const showLoader = (minDuration = 0) => {
    activeCountRef.current += 1;
    setIsLoading(true);

    if (minDuration > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        hideLoader();
      }, minDuration);
    }
  };

  const hideLoader = () => {
    activeCountRef.current = Math.max(0, activeCountRef.current - 1);
    if (activeCountRef.current === 0) {
      setIsLoading(false);
    }
  };

  const withLoading = async (asyncFn, minDuration = 400) => {
    showLoader();
    const startTime = Date.now();
    try {
      return await asyncFn();
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      setTimeout(() => {
        hideLoader();
      }, remaining);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoader, hideLoader, withLoading }}>
      {children}
      {isLoading && <BrandLoader fullScreen={true} />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
