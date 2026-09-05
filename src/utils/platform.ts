export const isMac = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Macintosh|Mac OS X/i.test(navigator.userAgent);
};

export const getModKey = (): string => {
  return isMac() ? '⌘' : 'Ctrl';
};

export const getAltKey = (): string => {
  return isMac() ? '⌥' : 'Alt';
};

export const getShiftKey = (): string => {
  return isMac() ? '⇧' : 'Shift';
};
