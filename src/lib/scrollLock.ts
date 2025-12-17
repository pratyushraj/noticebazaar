let scrollY = 0;
let isLocked = false;

const isIOS = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const ua = window.navigator.userAgent || '';
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
  const supportsTouchCallout =
    typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
      ? CSS.supports('-webkit-touch-callout', 'none')
      : false;

  return isIOSDevice || supportsTouchCallout;
};

export function lockBodyScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || isLocked) {
    return;
  }

  const ios = isIOS();

  if (ios) {
    scrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  } else {
    document.body.style.overflow = 'hidden';
  }

  isLocked = true;
}

export function unlockBodyScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !isLocked) {
    return;
  }

  const ios = isIOS();

  if (ios) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY || 0);
  } else {
    document.body.style.overflow = '';
  }

  isLocked = false;
}


