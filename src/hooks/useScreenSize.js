import { useMediaQuery, breakpoints } from '@openedx/paragon';

export function useScreenSize() {
  const isExtraSmall = useMediaQuery({ maxWidth: breakpoints.extraSmall.maxWidth });
  const isSmall = useMediaQuery({ maxWidth: breakpoints.small.maxWidth });
  const isMedium = useMediaQuery({ maxWidth: breakpoints.medium.maxWidth });
  const isLarge = useMediaQuery({ maxWidth: breakpoints.large.maxWidth });
  const isExtraLarge = useMediaQuery({ minWidth: breakpoints.extraLarge.minWidth });

  return {
    isExtraSmall,
    isSmall,
    isMedium,
    isLarge,
    isExtraLarge,
  };
}
