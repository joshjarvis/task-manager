import { tasks, type Task, type InsertTask, type Priority } from "@shared/schema";

export interface IStorage {
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: Partial<Task>): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  scheduleTasks(): Promise<Task[]>;
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private tasks: Map<number, Task>;
  private users: Map<number, any>;
  private currentTaskId: number;
  private currentUserId: number;

  constructor() {
    this.tasks = new Map();
    this.users = new Map();
    this.currentTaskId = 1;
    this.currentUserId = 1;
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: Partial<Task>): Promise<Task> {
    const id = this.currentTaskId++;
    // For testing/demo purposes, we're using April 5, 2025 as our reference date
    const now = new Date('2025-04-05T12:00:00.000Z');

    // Create a properly typed task object
    const task: Task = { 
      id, 
      createdAt: now,
      title: insertTask.title || '',
      description: insertTask.description || null,
      estimatedHours: typeof insertTask.estimatedHours === 'string' 
        ? parseFloat(insertTask.estimatedHours) 
        : (insertTask.estimatedHours || 0),
      priority: (insertTask.priority as Priority) || 'medium',
      dueDate: insertTask.dueDate || new Date(),
      completed: insertTask.completed || 0,
      scheduledStart: insertTask.scheduledStart || null,
      scheduledEnd: insertTask.scheduledEnd || null
    };
    
    this.tasks.set(id, task);
    
    // Schedule tasks and then get the updated task with scheduling info
    await this.scheduleTasks();
    
    // Return the task with scheduling info
    const updatedTask = this.tasks.get(id);
    console.log("Task created and scheduled:", updatedTask);
    return updatedTask || task;
  }

  async updateTask(id: number, taskUpdate: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    // Handle type conversion for estimatedHours if it's a string
    if (taskUpdate.estimatedHours !== undefined && typeof taskUpdate.estimatedHours === 'string') {
      taskUpdate.estimatedHours = parseFloat(taskUpdate.estimatedHours);
    }

    const updatedTask = { ...task, ...taskUpdate };
    this.tasks.set(id, updatedTask);
    
    // If task attributes that affect scheduling are updated, reschedule
    if (taskUpdate.estimatedHours || taskUpdate.priority || taskUpdate.dueDate) {
      await this.scheduleTasks();
    }
    
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const deleted = this.tasks.delete(id);
    if (deleted) {
      await this.scheduleTasks();
    }
    return deleted;
  }

  async scheduleTasks(): Promise<Task[]> {
    console.log("⏰ Starting task scheduling...");
    
    // Get all incomplete tasks
    const allTasks = Array.from(this.tasks.values());
    console.log(`Total tasks in storage: ${allTasks.length}`);
    
    const incompleteTasks = allTasks
      .filter(task => !task.completed)
      .sort((a, b) => {
        // Sort by priority (high -> medium -> low)
        const priorityMap: Record<Priority, number> = { 
          high: 3, 
          medium: 2, 
          low: 1 
        };
        
        // First sort by due date
        const dateComparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (dateComparison !== 0) return dateComparison;
        
        // Then by priority
        return priorityMap[b.priority] - priorityMap[a.priority];
      });
    
    console.log(`Tasks to be scheduled: ${incompleteTasks.length}`);

    // For testing/demo purposes, we're using April 5, 2025 as our reference date
    // In a production app, we'd use new Date() for the current time
    const now = new Date('2025-04-05T12:00:00.000Z'); // Noon on April 5th, 2025
    console.log("Current reference time:", {
      iso: now.toISOString(),
      utc: now.toUTCString(),
      local: now.toString(),
      hours: now.getHours(),
      minutes: now.getMinutes()
    });

    // Keep track of the latest scheduled end time to avoid overlaps
    let latestScheduledEndTime = new Date(0); // Start with epoch time
    
    // Schedule each task with strict timezone consistency and sequential scheduling
    for (const task of incompleteTasks) {
      console.log(`\n----- Scheduling task: ${task.title} (ID: ${task.id}) -----`);
      
      // Parse due date with explicit timezone information
      const dueDate = new Date(task.dueDate);
      const dueHours = dueDate.getHours();
      const dueMinutes = dueDate.getMinutes();
      
      console.log(`Due date information:`, {
        original: task.dueDate,
        parsed: dueDate.toString(),
        iso: dueDate.toISOString(),
        utc: dueDate.toUTCString(),
        hours: dueHours,
        minutes: dueMinutes
      });
      
      // Initialize scheduling time based on current time
      let scheduledTime = new Date(now);
      
      // WORKING HOURS IN UTC: 9 AM - 5 PM UTC
      // We're using UTC times for consistency with client display
      
      // First, determine if we can use the due date time
      let useSpecificTime = false;
      
      if (dueHours >= 9 && dueHours < 17) {
        console.log(`Due time ${dueHours}:${dueMinutes} is within working hours (9 AM - 5 PM UTC)`);
        // Apply due date's time to the scheduled date
        scheduledTime.setHours(dueHours, dueMinutes, 0, 0);
        useSpecificTime = true;
      } else {
        console.log(`Due time ${dueHours}:${dueMinutes} is outside working hours, will use 9 AM UTC`);
        // Default to 9 AM start time
        scheduledTime.setHours(9, 0, 0, 0);
      }
      
      // Never schedule in the past
      if (scheduledTime < now) {
        console.log("Scheduled time is in the past, adjusting to current time");
        scheduledTime = new Date(now);
        
        // Round to next 15-minute interval for clean scheduling
        const minutes = scheduledTime.getMinutes();
        const remainder = minutes % 15;
        if (remainder > 0) {
          scheduledTime.setMinutes(minutes + (15 - remainder));
        }
        useSpecificTime = false; // Reset since we're not using due date time anymore
      }
      
      // Enforce working hours (9 AM - 5 PM UTC)
      const currentHour = scheduledTime.getHours();
      if (currentHour < 9 || currentHour >= 17) {
        console.log(`Current hour ${currentHour} is outside working hours (9 AM - 5 PM UTC)`);
        
        // If after work hours, move to next day
        if (currentHour >= 17) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
          console.log(`Moving to next day: ${scheduledTime.toDateString()}`);
        }
        
        // Set to 9 AM
        scheduledTime.setHours(9, 0, 0, 0);
        console.log(`Adjusted to 9 AM UTC: ${scheduledTime.toLocaleTimeString()}`);
      }
      
      // Calculate task duration
      const taskDurationMs = Number(task.estimatedHours) * 60 * 60 * 1000;
      
      // Check if this task needs to be scheduled after the latest end time
      // This ensures sequential scheduling and no overlaps
      if (latestScheduledEndTime > new Date(0) && scheduledTime < latestScheduledEndTime) {
        console.log(`Task would overlap with previous task, adjusting start time to ${latestScheduledEndTime.toISOString()}`);
        scheduledTime = new Date(latestScheduledEndTime);
      }
      
      // Tasks must fit within working hours
      // Define end of working day (5 PM UTC)
      const endOfWorkDay = new Date(scheduledTime);
      endOfWorkDay.setHours(17, 0, 0, 0);
      
      // Calculate when the task would end
      const tentativeEndTime = new Date(scheduledTime.getTime() + taskDurationMs);
      
      if (tentativeEndTime > endOfWorkDay) {
        console.log("Task would extend beyond 5 PM UTC, moving to next working day");
        scheduledTime.setDate(scheduledTime.getDate() + 1);
        scheduledTime.setHours(9, 0, 0, 0);
        console.log(`New scheduled start: ${scheduledTime.toISOString()}`);
      }
      
      // Final scheduled times
      const scheduledStart = new Date(scheduledTime);
      const scheduledEnd = new Date(scheduledTime.getTime() + taskDurationMs);
      
      // Update the latest end time to ensure the next task starts after this one
      latestScheduledEndTime = new Date(scheduledEnd);
      
      // Debugging info about the difference between UTC and browser time
      console.log(`Note: A task scheduled at 10 AM UTC will appear as around 8:30 PM in Adelaide (UTC+10:30)`);
      
      // Comprehensive logging of the final scheduling decision
      console.log(`FINAL SCHEDULING for task '${task.title}':`, {
        estimatedHours: task.estimatedHours,
        startTime: {
          iso: scheduledStart.toISOString(),
          utc: scheduledStart.toUTCString(),
          hours: scheduledStart.getHours(),
          minutes: scheduledStart.getMinutes()
        },
        endTime: {
          iso: scheduledEnd.toISOString(),
          utc: scheduledEnd.toUTCString(),
          hours: scheduledEnd.getHours(),
          minutes: scheduledEnd.getMinutes()
        }
      });
      
      // Update the task with scheduled times
      const updatedTask = { 
        ...task, 
        scheduledStart, 
        scheduledEnd 
      };
      this.tasks.set(task.id, updatedTask);
    }

    return Array.from(this.tasks.values());
  }

  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
