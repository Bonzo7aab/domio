"use client";

import * as React from "react";
// Recharts is imported but not used in this file - it's only used when charts are actually rendered
// This allows tree-shaking to work properly with optimizePackageImports in next.config.js

import { cn } from "./utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer(props: any) {
  const { id, nameKey } = props;
  return (
    <div id={id} className="h-80 w-full">
      {nameKey}
    </div>
  );
}

export { ChartContainer, useChart };