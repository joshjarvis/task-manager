import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import Header from "@/components/Header";
import TaskList from "@/components/TaskList";
import Calendar from "@/components/Calendar";
import TaskForm from "@/components/TaskForm";
import { FilterOption, CalendarViewType } from "@/lib/types";
import { useMobile } from "@/hooks/useMobile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [activeView, setActiveView] = useState<"tasks" | "calendar">("tasks");
  const [calendarView, setCalendarView] = useState<CalendarViewType>("day");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useMobile();

  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleTaskCreated = () => {
    setIsFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    toast({
      title: selectedTask ? "Task updated" : "Task created",
      description: "Your task has been saved and scheduled",
    });
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const filteredTasks = tasks.filter(task => {
    if (searchQuery) {
      return task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onAddTask={handleAddTask} 
        isMobile={isMobile}
      />

      {isMobile && (
        <div className="bg-white shadow-md">
          <div className="flex justify-around">
            <button 
              className={`flex-1 py-3 text-center ${activeView === 'tasks' ? 'text-primary border-b-2 border-primary' : 'text-neutral-300'}`}
              onClick={() => setActiveView('tasks')}
            >
              <span className="material-icons block mx-auto mb-1">check_circle</span>
              Tasks
            </button>
            <button 
              className={`flex-1 py-3 text-center ${activeView === 'calendar' ? 'text-primary border-b-2 border-primary' : 'text-neutral-300'}`}
              onClick={() => setActiveView('calendar')}
            >
              <span className="material-icons block mx-auto mb-1">calendar_today</span>
              Calendar
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col md:flex-row container mx-auto px-4 py-6 gap-6">
        <TaskList 
          tasks={filteredTasks}
          isLoading={isLoading}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onEditTask={handleEditTask}
          onAddTask={handleAddTask}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          className={isMobile && activeView !== 'tasks' ? 'hidden' : 'md:w-2/5 lg:w-1/3 flex flex-col h-full'}
        />

        <Calendar 
          tasks={tasks}
          view={calendarView}
          setView={setCalendarView}
          onEditTask={handleEditTask}
          currentDate={currentDate}
          onDateChange={handleDateChange}
          className={isMobile && activeView !== 'calendar' ? 'hidden' : 'md:w-3/5 lg:w-2/3 bg-white rounded-lg shadow-md p-4 flex flex-col h-full'}
        />
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <TaskForm 
            task={selectedTask}
            onTaskSaved={handleTaskCreated}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
