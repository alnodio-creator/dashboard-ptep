export const landUseTypes = [
  "Residential",
  "Commercial",
  "Industrial",
  "Rural",
  "Other",
] as const;
export type LandUse = (typeof landUseTypes)[number];

export type LandUseRow = {
  landUse: LandUse;
  currentValue: number;
  previousValue: number;
  properties: number;
};

export type LgaSummary = {
  lga: string;
  code: string;
  rowsByYear: Record<string, LandUseRow[]>;
};

const categories: LandUse[] = [...landUseTypes];

function makeRows(seed: number, yearIndex: number): LandUseRow[] {
  const base = [
    98_000_000_000, 5_700_000_000, 10_700_000_000, 3_800_000, 1_200_000_000,
  ];
  const counts = [82_800, 1_540, 1_160, 86, 3_220];
  return categories.map((landUse, index) => {
    const previousValue = Math.round(
      base[index] * (1 + seed * 0.08 + yearIndex * 0.045),
    );
    const change = 1.025 + ((seed + index + yearIndex) % 5) * 0.012;
    return {
      landUse,
      previousValue,
      currentValue: Math.round(previousValue * change),
      properties: Math.round(
        counts[index] * (1 + seed * 0.04 + yearIndex * 0.018),
      ),
    };
  });
}

export const baseYears = ["2021", "2022", "2023", "2024", "2025"];

export const landValueSummaries: LgaSummary[] = [
  {
    lga: "Canterbury-Bankstown",
    code: "258",
    rowsByYear: Object.fromEntries(
      baseYears.map((year, i) => [year, makeRows(0, i)]),
    ),
  },
  {
    lga: "Parramatta",
    code: "179",
    rowsByYear: Object.fromEntries(
      baseYears.map((year, i) => [year, makeRows(1, i)]),
    ),
  },
  {
    lga: "Blacktown",
    code: "107",
    rowsByYear: Object.fromEntries(
      baseYears.map((year, i) => [year, makeRows(2, i)]),
    ),
  },
  {
    lga: "Liverpool",
    code: "153",
    rowsByYear: Object.fromEntries(
      baseYears.map((year, i) => [year, makeRows(3, i)]),
    ),
  },
  {
    lga: "Northern Beaches",
    code: "150",
    rowsByYear: Object.fromEntries(
      baseYears.map((year, i) => [year, makeRows(4, i)]),
    ),
  },
];

export function getSummary(lga: string, year: string) {
  return (
    landValueSummaries.find((item) => item.lga === lga)?.rowsByYear[year] ?? []
  );
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-AU").format(value);
export const formatDate = (year: string) => `02 Jan ${year}`;
export const percentChange = (current: number, previous: number) =>
  ((current - previous) / previous) * 100;
export const compactCurrency = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const chartKeys = {
  Residential: "residential",
  Commercial: "commercial",
  Industrial: "industrial",
  Rural: "rural",
  Other: "other",
} as const;
