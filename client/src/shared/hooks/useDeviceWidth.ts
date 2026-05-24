import { useState, useEffect } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type DeviceType = 'mobile' | 'tablet' | 'desktop';

const useDeviceWidth = (): {
  breakpoint: Breakpoint;
  deviceType: DeviceType;
} => {
  // Initialize with default values that work for SSR
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        const width = window.innerWidth;
        const newBreakpoint = getBreakpoint(width);
        setBreakpoint(newBreakpoint);
        setDeviceType(getDeviceType(width));
      };

      // Set initial values
      handleResize();

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return { breakpoint, deviceType };
};

function getBreakpoint(width: number): Breakpoint {
  if (width < 576) return 'xs';
  if (width >= 576 && width < 768) return 'sm';
  if (width >= 768 && width < 1024) return 'md';
  if (width >= 1024 && width < 1280) return 'lg';
  return 'xl';
}

function getDeviceType(width: number): DeviceType {
  if (width < 768) return 'mobile';
  if (width >= 768 && width < 1024) return 'tablet';
  return 'desktop';
}

export default useDeviceWidth;
