import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Task, taskFormSchema } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TaskFormValues } from "@/lib/types";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { format } from "date-fns";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface TaskFormProps {
  task: Task | null;
  onTaskSaved: () => void;
  onCancel: () => void;
}

export default function TaskForm({ task, onTaskSaved, onCancel }: TaskFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create form with default values
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description || "",
          estimatedHours: Number(task.estimatedHours),
          priority: task.priority,
          dueDate: new Date(task.dueDate),
        }
      : {
          title: "",
          description: "",
          estimatedHours: 1,
          priority: "medium",
          dueDate: dayjs().tz('Australia/Adelaide').add(1, 'day').hour(17).minute(0).second(0).toDate(), // tomorrow 5 PM Adelaide time
        },
  });

  const onSubmit = async (data: TaskFormValues) => {
    try {
      // Convert the due date to Adelaide timezone before submission
      const adelaideDueDate = dayjs(data.dueDate).tz('Australia/Adelaide');
      
      const submissionData = {
        ...data,
        dueDate: adelaideDueDate.toDate()
      };
      
      if (task) {
        // Update existing task
        await apiRequest("PATCH", `/api/tasks/${task.id}`, submissionData);
      } else {
        // Create new task
        await apiRequest("POST", "/api/tasks", submissionData);
      }
      
      // Invalidate tasks query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      onTaskSaved();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${task ? "update" : "create"} task`,
        variant: "destructive",
      });
      console.error("Form submission error:", error);
    }
  };

  return (
    <div className="px-6 py-5">
      <DialogHeader className="mb-6 pb-2 border-b border-gray-100">
        <DialogTitle className="text-lg font-medium text-gray-800">
          {task ? "Edit Task" : "New Task"}
        </DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-600">Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="What do you need to do?" 
                    {...field} 
                    className="w-full p-2.5 border border-gray-200 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-100 focus:ring-opacity-50"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-600">Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add details about this task" 
                    {...field} 
                    className="w-full p-2.5 border border-gray-200 rounded-md resize-none focus:border-blue-300 focus:ring focus:ring-blue-100 focus:ring-opacity-50" 
                    rows={3}
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-500" />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="estimatedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600">Estimated Hours</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      min={0.25} 
                      step={0.25} 
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      className="w-full p-2.5 border border-gray-200 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-100 focus:ring-opacity-50" 
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600">Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full h-10 border border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-100 focus:ring-opacity-50">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600">Due Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      value={format(field.value, "yyyy-MM-dd")}
                      onChange={e => {
                        // Preserve the time part of the existing date
                        const newDate = new Date(e.target.value);
                        const currentDate = field.value;
                        newDate.setHours(
                          currentDate.getHours(),
                          currentDate.getMinutes(),
                          currentDate.getSeconds()
                        );
                        field.onChange(newDate);
                      }}
                      className="w-full p-2.5 border border-gray-200 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-100 focus:ring-opacity-50" 
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-600">Due Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      value={format(field.value, "HH:mm")}
                      onChange={e => {
                        // Preserve the date part but update the time
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const newDate = new Date(field.value);
                        newDate.setHours(hours);
                        newDate.setMinutes(minutes);
                        field.onChange(newDate);
                      }}
                      className="w-full p-2.5 border border-gray-200 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-100 focus:ring-opacity-50" 
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-500" />
                </FormItem>
              )}
            />
          </div>
          
          {/* Timezone note */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3.5 rounded-md border border-gray-100">
            <p>
              <span className="font-medium">Note:</span> The system will schedule your task during working hours (9AM-5PM Adelaide time).
            </p>
          </div>
          
          <DialogFooter className="mt-8 pt-5 pb-1 border-t border-gray-100 flex justify-end space-x-3">
            <Button 
              type="button" 
              onClick={onCancel} 
              className="btn-macos text-sm font-medium py-1.5 px-5"
              variant="outline"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1.5 px-5 rounded-md animate-scale"
            >
              {task ? "Update" : "Create"} Task
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
}
