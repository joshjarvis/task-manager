import { Task } from "@shared/schema";
import { formatDate, formatHours, isOverdue, isDueSoon } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const dueDate = new Date(task.dueDate);
  const isTaskOverdue = isOverdue(dueDate);
  const isTaskDueSoon = isDueSoon(dueDate);
  
  // MacOS-style priority indicator
  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'low': return 'priority-indicator priority-low';
      case 'medium': return 'priority-indicator priority-medium';
      case 'high': return 'priority-indicator priority-high';
      default: return 'priority-indicator priority-low';
    }
  };
  
  return (
    <div 
      className="task-card bg-white rounded-lg p-3.5 mb-3 cursor-pointer"
      onClick={(e) => {
        // Don't trigger edit if clicking on action buttons
        if (!(e.target as HTMLElement).closest('.action-button')) {
          onEdit();
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-center">
          <div className={getPriorityIndicator(task.priority)} title={`${task.priority} priority`}></div>
          <h3 className="font-medium text-gray-800">{task.title}</h3>
        </div>
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            className="material-icons text-sm text-gray-400 hover:text-gray-600 action-button p-0.5"
            onClick={onEdit}
          >
            edit
          </button>
          <button 
            className="material-icons text-sm text-gray-400 hover:text-gray-600 action-button p-0.5"
            onClick={onDelete}
          >
            delete
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex flex-wrap gap-3 items-center text-xs text-gray-500">
        <span className="flex items-center">
          <span className="material-icons text-xs mr-1">schedule</span>
          <span>{formatHours(Number(task.estimatedHours))}</span>
        </span>
        
        <span className={`flex items-center ${
          isTaskOverdue ? 'text-rose-500 font-medium' : 
          (isTaskDueSoon ? 'text-amber-500' : '')
        }`}>
          <span className="material-icons text-xs mr-1">calendar_today</span>
          <span>Due {formatDate(dueDate)}</span>
        </span>
      </div>
    </div>
  );
}
