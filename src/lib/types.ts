export type TransactionType = "income" | "expense";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  is_default: boolean;
  is_savings: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  name: string;
  amount: number;
  transaction_date: string;
  notes: string | null;
  source: string;
  recurring_rule_id: string | null;
  created_at?: string;
  updated_at?: string;
  categories?: Pick<Category, "id" | "name" | "color" | "icon" | "is_savings"> | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  month: string;
  amount: number;
  created_at?: string;
  updated_at?: string;
  categories?: Pick<Category, "id" | "name" | "color" | "icon"> | null;
}

export interface RecurringRule {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  last_generated_date: string | null;
  created_at?: string;
  updated_at?: string;
  categories?: Pick<Category, "id" | "name" | "color" | "icon"> | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  currency: string;
}

export interface ActionResult<T = undefined> {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
}

export interface TransactionFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: TransactionType | "all";
  categoryId?: string;
  from?: string;
  to?: string;
  sort?: "transaction_date" | "amount" | "name";
  order?: "asc" | "desc";
}

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  savings: number;
  net: number;
  balance: number;
  transactionCount: number;
}

export interface CategoryTotal {
  categoryId: string | null;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface BudgetItem {
  id: string | null;
  categoryId: string | null;
  categoryName: string;
  color: string;
  budget: number;
  used: number;
  remaining: number;
  percentage: number;
}

export interface BudgetSummary {
  total: number;
  used: number;
  remaining: number;
  percentage: number;
  items: BudgetItem[];
}

export interface ChartPoint {
  month: string;
  monthLabel: string;
  label?: string;
  income: number;
  expense: number;
  savings: number;
  net: number;
  balance: number;
  target: number;
}

export interface DashboardData {
  month: string;
  currency: string;
  overview: {
    balance: number;
    income: number;
    expense: number;
    savings: number;
    incomeChange: number;
    expenseChange: number;
    savingsChange: number;
  };
  charts: {
    incomeVsExpense: ChartPoint[];
    cashFlow: ChartPoint[];
    expenseByCategory: CategoryTotal[];
    trends: ChartPoint[];
    savingsProgress: ChartPoint[];
  };
  recentTransactions: Transaction[];
  budget: BudgetSummary;
}

export interface ReportData {
  month: string;
  year: number;
  summary: MonthlySummary;
  previous: MonthlySummary;
  categoryTotals: CategoryTotal[];
  monthly: MonthlySummary[];
  yearly: {
    income: number;
    expense: number;
    savings: number;
    net: number;
  };
}
