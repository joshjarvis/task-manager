import { tasks, type Task, type InsertTask, type Priority } from "@shared/schema";

// Add dayjs and its timezone plugin for better timezone handling
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone to Adelaide
dayjs.tz.setDefault('Australia/Adelaide');

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
    const now = new Date();
    
    const task: Task = { 
      id, 
      createdAt: now,
      title: insertTask.title || '',
      description: insertTask.description || null,
      estimatedHours: typeof insertTask.estimatedHours === 'string' 
        ? parseFloat(insertTask.estimatedHours) 
        : (insertTask.estimatedHours || 0),
      priority: (insertTask.priority as Priority) || 'medium',
      dueDate: insertTask.dueDate ? new Date(insertTask.dueDate) : now,
      completed: insertTask.completed || 0,
      scheduledStart: insertTask.scheduledStart || null,
      scheduledEnd: insertTask.scheduledEnd || null
    };
    
    this.tasks.set(id, task);
    
    // Schedule tasks and then get the updated task with scheduling info
    await this.scheduleTasks();
    
    const updatedTask = this.tasks.get(id);
    console.log("Task created and scheduled:", updatedTask);
    return updatedTask || task;
  }

  async updateTask(id: number, taskUpdate: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    if (taskUpdate.estimatedHours !== undefined && typeof taskUpdate.estimatedHours === 'string') {
      taskUpdate.estimatedHours = parseFloat(taskUpdate.estimatedHours);
    }

    const updatedTask = { ...task, ...taskUpdate };
    this.tasks.set(id, updatedTask);
    
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
    
    const allTasks = Array.from(this.tasks.values());
    console.log(`Total tasks in storage: ${allTasks.length}`);
    
    const incompleteTasks = allTasks
      .filter(task => !task.completed)
      .sort((a, b) => {
        const priorityMap: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
        
        // Sort by due date first, then by priority
        const dateComparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (dateComparison !== 0) return dateComparison;
        return priorityMap[b.priority] - priorityMap[a.priority];
      });
    
    console.log(`Tasks to be scheduled: ${incompleteTasks.length}`);
    
    // Get current date and time
    const now = new Date();
    console.log("Current time:", now.toLocaleString());

    // Track scheduled time slots to avoid overlaps
    const scheduledSlots: { start: Date; end: Date }[] = [];
    
    for (const task of incompleteTasks) {
      console.log(`\n----- Scheduling task: ${task.title} (ID: ${task.id}) -----`);
      
      const dueDate = new Date(task.dueDate);
      console.log("Due date:", dueDate.toLocaleString());
      
      // Simple scheduling: always schedule at 9 AM on the due date
      // If due date is in past, schedule for 9 AM tomorrow
      let scheduledDate = new Date(dueDate);
      
      // Set time to 9:00 AM
      scheduledDate.setHours(9, 0, 0, 0);
      
      // If the due date is in the past, schedule for tomorrow
      if (scheduledDate < now) {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        scheduledDate = tomorrow;
        console.log("Due date is in the past, scheduling for tomorrow at 9 AM:", scheduledDate.toLocaleString());
      }
      
      // Calculate end time based on estimated hours
      const taskDurationMs = Number(task.estimatedHours) * 60 * 60 * 1000;
      const scheduledEnd = new Date(scheduledDate.getTime() + taskDurationMs);
      
      console.log("Task scheduled for:", {
        date: scheduledDate.toLocaleDateString(),
        startTime: scheduledDate.toLocaleTimeString(),
        endTime: scheduledEnd.toLocaleTimeString(),
        estimatedHours: task.estimatedHours
      });
      
      // Update the task with scheduled times
      const updatedTask = { 
        ...task, 
        scheduledStart: scheduledDate,
        scheduledEnd: scheduledEnd
      };
      this.tasks.set(task.id, updatedTask);
      
      // Add to scheduled slots for future overlap checking
      scheduledSlots.push({
        start: scheduledDate,
        end: scheduledEnd
      });
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
