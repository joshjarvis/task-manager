import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Task, taskFormSchema } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TaskFormValues } from "@/lib/types";
import { format } from "date-fns";

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
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        },
  });

  const onSubmit = async (data: TaskFormValues) => {
    try {
      if (task) {
        // Update existing task
        await apiRequest("PATCH", `/api/tasks/${task.id}`, data);
      } else {
        // Create new task
        await apiRequest("POST", "/api/tasks", data);
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
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-medium">
          {task ? "Edit Task" : "New Task"}
        </DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-neutral-500">Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="What do you need to do?" 
                    {...field} 
                    className="w-full p-2 border rounded-md"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-neutral-500">Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add details about this task" 
                    {...field} 
                    className="w-full p-2 border rounded-md resize-none" 
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="estimatedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-500">Estimated Length (hours)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      min={0.25} 
                      step={0.25} 
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      className="w-full p-2 border rounded-md" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-500">Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-neutral-500">Due Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    value={format(field.value, "yyyy-MM-dd")}
                    onChange={e => field.onChange(new Date(e.target.value))}
                    className="w-full p-2 border rounded-md" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Task
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
