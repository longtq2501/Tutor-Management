export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
  wide: 1536,
  ultra: 1920,
  ultraWide: 2560,
} as const;

export type ResponsiveDensity = 'comfortable' | 'compact' | 'tight';

export type DensityEstimate = {
  itemPx: number;
  sectionTitlePx: number;
  sectionGapPx: number;
  sectionTopPx: number;
};

export type SidebarDensityPreset = {
  navItemHeightClass: string;
  sectionGapClass: string;
  sectionTopPaddingClass: string;
  sectionTitlePaddingClass: string;
  navVerticalPaddingClass: string;
  iconSize: number;
  headerClass: string;
  logoBoxSize: number;
  logoIconSize: number;
  footerClass: string;
  estimate: DensityEstimate;
};

// Shared presets that can be reused by other vertical navigations/panels.
export const SIDEBAR_DENSITY_PRESETS: Record<ResponsiveDensity, SidebarDensityPreset> = {
  comfortable: {
    navItemHeightClass: 'h-14',
    sectionGapClass: 'space-y-5',
    sectionTopPaddingClass: 'pt-4',
    sectionTitlePaddingClass: 'pb-2',
    navVerticalPaddingClass: 'py-2',
    iconSize: 22,
    headerClass: 'h-20 px-6 mb-2',
    logoBoxSize: 40,
    logoIconSize: 24,
    footerClass: 'px-4 py-2',
    estimate: {
      itemPx: 56,
      sectionTitlePx: 24,
      sectionGapPx: 20,
      sectionTopPx: 16,
    },
  },
  compact: {
    navItemHeightClass: 'h-12',
    sectionGapClass: 'space-y-4',
    sectionTopPaddingClass: 'pt-3',
    sectionTitlePaddingClass: 'pb-1.5',
    navVerticalPaddingClass: 'py-1.5',
    iconSize: 21,
    headerClass: 'h-16 px-5 mb-1.5',
    logoBoxSize: 36,
    logoIconSize: 22,
    footerClass: 'px-4 py-2',
    estimate: {
      itemPx: 48,
      sectionTitlePx: 22,
      sectionGapPx: 16,
      sectionTopPx: 12,
    },
  },
  tight: {
    navItemHeightClass: 'h-10',
    sectionGapClass: 'space-y-3',
    sectionTopPaddingClass: 'pt-2.5',
    sectionTitlePaddingClass: 'pb-1',
    navVerticalPaddingClass: 'py-1',
    iconSize: 20,
    headerClass: 'h-14 px-4 mb-1',
    logoBoxSize: 34,
    logoIconSize: 20,
    footerClass: 'px-4 py-1.5',
    estimate: {
      itemPx: 40,
      sectionTitlePx: 20,
      sectionGapPx: 12,
      sectionTopPx: 10,
    },
  },
};

export const getSidebarExpandedWidth = (viewportWidth: number): number => {
  if (viewportWidth >= BREAKPOINTS.ultraWide) return 400;
  if (viewportWidth >= BREAKPOINTS.ultra) return 350;
  if (viewportWidth >= BREAKPOINTS.wide) return 320;
  if (viewportWidth >= BREAKPOINTS.desktop) return 300;
  return 275;
};

export const getSidebarCollapsedWidth = (viewportWidth: number): number => {
  if (viewportWidth >= BREAKPOINTS.ultra) return 88;
  if (viewportWidth >= BREAKPOINTS.wide) return 80;
  if (viewportWidth >= BREAKPOINTS.desktop) return 72;
  return 64;
};

export const estimateNavRequiredHeight = (
  estimate: DensityEstimate,
  itemCount: number,
  sectionCount: number
): number => {
  const separators = Math.max(0, sectionCount - 1);
  return (itemCount * estimate.itemPx)
    + (sectionCount * estimate.sectionTitlePx)
    + (separators * (estimate.sectionGapPx + estimate.sectionTopPx));
};

export const resolveSidebarDensity = (params: {
  itemCount: number;
  sectionCount: number;
  viewportHeight: number;
  reservedHeight?: number;
}): ResponsiveDensity => {
  const { itemCount, sectionCount, viewportHeight, reservedHeight = 160 } = params;
  const availableNavHeight = Math.max(0, viewportHeight - reservedHeight);

  if (
    estimateNavRequiredHeight(SIDEBAR_DENSITY_PRESETS.comfortable.estimate, itemCount, sectionCount)
    <= availableNavHeight
  ) {
    return 'comfortable';
  }

  if (
    estimateNavRequiredHeight(SIDEBAR_DENSITY_PRESETS.compact.estimate, itemCount, sectionCount)
    <= availableNavHeight
  ) {
    return 'compact';
  }

  return 'tight';
};

export const isMobileViewport = (viewportWidth: number): boolean => {
  return viewportWidth < BREAKPOINTS.laptop;
};
