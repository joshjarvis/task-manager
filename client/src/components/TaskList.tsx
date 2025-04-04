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
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Tasks</h2>
          <div className="flex space-x-2">
            <button 
              className="p-1 text-neutral-400 hover:text-neutral-500"
              onClick={() => handleSortChange("priority")}
            >
              <span className="material-icons">
                {sortBy === "priority" 
                  ? (sortDirection === "asc" ? "arrow_upward" : "arrow_downward") 
                  : "filter_list"}
              </span>
            </button>
            <button 
              className="p-1 text-neutral-400 hover:text-neutral-500"
              onClick={() => handleSortChange("dueDate")}
            >
              <span className="material-icons">
                {sortBy === "dueDate" 
                  ? (sortDirection === "asc" ? "arrow_upward" : "arrow_downward") 
                  : "sort"}
              </span>
            </button>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search" 
                className="pl-8 pr-2 py-1 text-sm border rounded-md w-28 focus:outline-none focus:ring-1 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="material-icons text-neutral-400 absolute left-2 top-1/2 transform -translate-y-1/2 text-sm">search</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            className={`px-3 py-1 rounded-full text-sm ${activeFilter === "all" ? "bg-primary text-white" : "bg-neutral-100"}`}
            onClick={() => setActiveFilter("all")}
          >
            All
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm ${activeFilter === "today" ? "bg-primary text-white" : "bg-neutral-100"}`}
            onClick={() => setActiveFilter("today")}
          >
            Today
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm ${activeFilter === "week" ? "bg-primary text-white" : "bg-neutral-100"}`}
            onClick={() => setActiveFilter("week")}
          >
            This Week
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm ${activeFilter === "overdue" ? "bg-primary text-white" : "bg-neutral-100"}`}
            onClick={() => setActiveFilter("overdue")}
          >
            Overdue
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar">
        {isLoading ? (
          // Loading skeletons
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 mb-3">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex space-x-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-3" />
              <div className="flex flex-wrap gap-2 items-center">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))
        ) : sortedTasks.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <span className="material-icons text-4xl mb-2">task_alt</span>
            <p>No tasks to display</p>
            {searchQuery && <p className="mt-2">Try a different search term</p>}
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
        className="mt-4 bg-[#f50057] hover:bg-pink-600 text-white font-medium py-3 px-4 rounded-full shadow-lg flex items-center justify-center transition-colors"
        onClick={onAddTask}
      >
        <span className="material-icons mr-2">add</span>
        New Task
      </button>
    </section>
  );
}
