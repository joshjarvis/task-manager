import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FilterOption, SortOption, SortDirection } from "./types";
import { Task } from "@shared/schema";
import { startOfToday, endOfToday, startOfWeek, endOfWeek, isAfter, isBefore } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  });
}

export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-[#f44336]';
    case 'medium':
      return 'bg-[#ff9800]';
    case 'low':
      return 'bg-[#4caf50]';
    default:
      return 'bg-gray-400';
  }
}

export function getPriorityColorHex(priority: string): string {
  switch (priority) {
    case 'high':
      return '#f44336';
    case 'medium':
      return '#ff9800';
    case 'low':
      return '#4caf50';
    default:
      return '#9e9e9e';
  }
}

export function filterTasks(tasks: Task[], filter: FilterOption): Task[] {
  const today = new Date();
  const startOfWeekDate = startOfWeek(today);
  const endOfWeekDate = endOfWeek(today);

  switch (filter) {
    case 'today':
      return tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= startOfToday() && taskDate <= endOfToday();
      });
    case 'week':
      return tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= startOfWeekDate && taskDate <= endOfWeekDate;
      });
    case 'overdue':
      return tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate < startOfToday() && !task.completed;
      });
    case 'all':
    default:
      return tasks;
  }
}

export function sortTasks(tasks: Task[], sort: SortOption, direction: SortDirection): Task[] {
  return [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (sort) {
      case 'dueDate':
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'priority': {
        const priorityMap = { high: 3, medium: 2, low: 1 };
        comparison = (priorityMap[a.priority as keyof typeof priorityMap] || 0) - 
                    (priorityMap[b.priority as keyof typeof priorityMap] || 0);
        break;
      }
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });
}

export function formatHours(hours: number): string {
  if (hours >= 1) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours} ${wholeHours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `${wholeHours} ${wholeHours === 1 ? 'hour' : 'hours'} ${minutes} min`;
    }
  } else {
    return `${Math.round(hours * 60)} min`;
  }
}

export function isDueSoon(date: Date): boolean {
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);
  
  return isAfter(date, today) && isBefore(date, threeDaysFromNow);
}

export function isOverdue(date: Date): boolean {
  return isBefore(date, new Date());
}

// Ensure a value is a Date object
export function ensureDate(date: Date | string | null): Date | null {
  if (!date) return null;
  
  if (typeof date === 'string') {
    return new Date(date);
  }
  
  return date;
}
