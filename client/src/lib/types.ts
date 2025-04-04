import { Task } from "@shared/schema";

export type FilterOption = "all" | "today" | "week" | "overdue";

export type SortOption = "dueDate" | "priority" | "title";

export type SortDirection = "asc" | "desc";

export type CalendarViewType = "day" | "week" | "month";

export interface TaskFormValues {
  title: string;
  description: string;
  estimatedHours: number;
  priority: "low" | "medium" | "high";
  dueDate: Date;
}

export type TaskWithSchedule = Task;
