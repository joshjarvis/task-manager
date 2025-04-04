import { Task } from "@shared/schema";
import { getPriorityColor, formatDate, formatHours, isOverdue, isDueSoon } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const dueDate = new Date(task.dueDate);
  const isTaskOverdue = isOverdue(dueDate);
  const isTaskDueSoon = isDueSoon(dueDate);

  return (
    <div 
      className="task-card bg-white rounded-lg shadow-sm p-4 mb-3"
      onClick={(e) => {
        // Don't trigger edit if clicking on action buttons
        if (!(e.target as HTMLElement).closest('.action-button')) {
          onEdit();
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{task.title}</h3>
        <div className="flex space-x-1">
          <span 
            className="material-icons text-sm text-neutral-300 cursor-pointer hover:text-neutral-400 action-button"
            onClick={onEdit}
          >
            edit
          </span>
          <span 
            className="material-icons text-sm text-neutral-300 cursor-pointer hover:text-neutral-400 action-button"
            onClick={onDelete}
          >
            delete
          </span>
        </div>
      </div>
      <p className="text-sm text-neutral-400 mb-3 line-clamp-2">
        {task.description || "No description provided"}
      </p>
      <div className="flex flex-wrap gap-2 items-center text-xs">
        <span className="flex items-center">
          <span className="material-icons text-xs mr-1">schedule</span>
          <span>{formatHours(Number(task.estimatedHours))}</span>
        </span>
        <span className={`flex items-center ${isTaskOverdue ? 'text-red-500 font-medium' : (isTaskDueSoon ? 'text-orange-500' : '')}`}>
          <span className="material-icons text-xs mr-1">calendar_today</span>
          <span>Due {formatDate(dueDate)}</span>
        </span>
        <span className={`${getPriorityColor(task.priority)} text-white px-2 py-0.5 rounded-full`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      </div>
    </div>
  );
}
