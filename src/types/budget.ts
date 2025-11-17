/**
 * Consolidated Budget type definitions for jobs
 */

export type BudgetType = 'fixed' | 'hourly' | 'negotiable' | 'range';

export interface Budget {
  /** Minimum budget amount */
  min: number | null;
  /** Maximum budget amount (null for fixed/hourly single values) */
  max: number | null;
  /** Type of budget */
  type: BudgetType;
  /** Currency code (default: PLN) */
  currency: string;
}

/**
 * Helper type for budget input/creation (allows partial values)
 */
export interface BudgetInput {
  min?: number | null;
  max?: number | null;
  type?: BudgetType;
  currency?: string;
}

/**
 * Helper type for database budget fields (snake_case)
 */
export interface BudgetDatabase {
  budget_min: number | null;
  budget_max: number | null;
  budget_type: BudgetType;
  currency: string;
}

/**
 * Convert database budget format to Budget type
 */
export function budgetFromDatabase(db: BudgetDatabase): Budget {
  return {
    min: db.budget_min,
    max: db.budget_max,
    type: db.budget_type,
    currency: db.currency,
  };
}

/**
 * Convert Budget type to database format
 */
export function budgetToDatabase(budget: BudgetInput): BudgetDatabase {
  return {
    budget_min: budget.min ?? null,
    budget_max: budget.max ?? null,
    budget_type: budget.type || 'fixed',
    currency: budget.currency || 'PLN',
  };
}

/**
 * Format budget as display string
 */
export function formatBudget(budget: Budget | BudgetInput | null | undefined): string {
  if (!budget) return 'Do negocjacji';
  
  const min = budget.min ?? 0;
  const max = budget.max;
  const currency = budget.currency || 'PLN';
  const type = budget.type || 'fixed';
  
  if (type === 'negotiable') {
    return 'Do negocjacji';
  }
  
  if (type === 'hourly') {
    return `${min} ${currency}/h`;
  }
  
  if (max && max !== min) {
    return `${min} - ${max} ${currency}`;
  }
  
  return `${min} ${currency}`;
}

/**
 * Check if budget is valid
 */
export function isValidBudget(budget: BudgetInput | null | undefined): boolean {
  if (!budget) return false;
  
  const min = budget.min;
  const max = budget.max;
  
  if (budget.type === 'negotiable') {
    return true; // Negotiable budgets don't require values
  }
  
  if (min === null || min === undefined) {
    return false;
  }
  
  if (max !== null && max !== undefined && max < min) {
    return false;
  }
  
  return true;
}

