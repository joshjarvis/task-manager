import { useState } from "react";
import { Task } from "@shared/schema";
import { FilterOption, SortOption, SortDirection } from "@/lib/types";
import { filterTasks, sortTasks } from "@/lib/utils";
import TaskCard from "./TaskCard";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  activeFilter: FilterOption;
  setActiveFilter: (filter: FilterOption) => void;
  onEditTask: (task: Task) => void;
  onAddTask: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  className?: string;
}

export default function TaskList({
  tasks,
  isLoading,
  activeFilter,
  setActiveFilter,
  onEditTask,
  onAddTask,
  searchQuery,
  setSearchQuery,
  className = "",
}: TaskListProps) {
  const [sortBy, setSortBy] = useState<SortOption>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDeleteTask = async (taskId: number) => {
    try {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "The task has been removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      // Toggle direction if clicking the same option
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(option);
      setSortDirection("asc");
    }
  };

  // Apply filters and sorting
  const filteredTasks = filterTasks(tasks, activeFilter);
  const sortedTasks = sortTasks(filteredTasks, sortBy, sortDirection);

  return (
    <section className={className}>
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-medium text-gray-800">Tasks</h2>
          <div className="flex space-x-1">
            <button 
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              onClick={() => handleSortChange("priority")}
              title="Sort by priority"
            >
              <span className="material-icons text-sm">
                {sortBy === "priority" 
                  ? (sortDirection === "asc" ? "arrow_upward" : "arrow_downward") 
                  : "filter_list"}
              </span>
            </button>
            <button 
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              onClick={() => handleSortChange("dueDate")}
              title="Sort by due date"
            >
              <span className="material-icons text-sm">
                {sortBy === "dueDate" 
                  ? (sortDirection === "asc" ? "arrow_upward" : "arrow_downward") 
                  : "sort"}
              </span>
            </button>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search" 
                className="pl-7 pr-2 py-1 text-sm border rounded-md w-28 focus:outline-none focus:ring-1 focus:ring-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="material-icons text-gray-400 absolute left-1.5 top-1/2 transform -translate-y-1/2 text-sm">search</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <button 
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeFilter === "all" 
                ? "bg-blue-50 text-blue-600 border border-blue-100" 
                : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
            }`}
            onClick={() => setActiveFilter("all")}
          >
            All
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeFilter === "today" 
                ? "bg-blue-50 text-blue-600 border border-blue-100" 
                : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
            }`}
            onClick={() => setActiveFilter("today")}
          >
            Today
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeFilter === "week" 
                ? "bg-blue-50 text-blue-600 border border-blue-100" 
                : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
            }`}
            onClick={() => setActiveFilter("week")}
          >
            This Week
          </button>
          <button 
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeFilter === "overdue" 
                ? "bg-blue-50 text-blue-600 border border-blue-100" 
                : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
            }`}
            onClick={() => setActiveFilter("overdue")}
          >
            Overdue
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar pr-1 -mr-1">
        {isLoading ? (
          // Loading skeletons
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-3.5 mb-3">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex space-x-1">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-3" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-5/6 mb-3" />
              <div className="flex flex-wrap gap-2 items-center">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : sortedTasks.length === 0 ? (
          <div className="text-center py-10 bg-white/50 rounded-lg border border-gray-100">
            <span className="material-icons text-3xl text-gray-300 mb-2">task_alt</span>
            <p className="text-gray-500">No tasks to display</p>
            {searchQuery && <p className="mt-1 text-sm text-gray-400">Try a different search term</p>}
          </div>
        ) : (
          sortedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))
        )}
      </div>

      <button 
        className="group mt-4 btn-macos flex items-center justify-center py-2 px-4 rounded-md shadow-sm animate-scale w-full"
        onClick={onAddTask}
      >
        <span className="material-icons text-primary mr-1.5 text-sm">add</span>
        <span className="text-sm font-medium">New Task</span>
      </button>
    </section>
  );
}
