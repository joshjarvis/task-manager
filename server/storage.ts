import { tasks, type Task, type InsertTask, type Priority } from "@shared/schema";

export interface IStorage {
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
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

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date();
    
    // Create a properly typed task object with explicit type casting
    const task: Task = { 
      id, 
      createdAt: now,
      title: insertTask.title,
      description: insertTask.description || null,
      estimatedHours: insertTask.estimatedHours,
      priority: insertTask.priority as Priority, // Cast to ensure correct type
      dueDate: insertTask.dueDate,
      completed: 0,
      scheduledStart: null,
      scheduledEnd: null
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

    // Simple scheduling algorithm
    // Start scheduling from now, with working hours 9 AM to 5 PM
    const now = new Date();
    let currentDate = new Date(now);
    currentDate.setHours(9, 0, 0, 0); // Start at 9 AM
    
    // If current time is past 5 PM, start scheduling from tomorrow
    if (now.getHours() >= 17) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    // If current time is between 9 AM and 5 PM, start from now
    else if (now.getHours() >= 9 && now.getHours() < 17) {
      currentDate = new Date(now);
      // Round up to the nearest 15 minutes
      const minutes = currentDate.getMinutes();
      const remainder = minutes % 15;
      if (remainder > 0) {
        currentDate.setMinutes(minutes + (15 - remainder));
      }
    }

    // Schedule each task
    for (const task of incompleteTasks) {
      // Get end of working day
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(17, 0, 0, 0);

      // Calculate task duration in milliseconds
      const taskDurationMs = Number(task.estimatedHours) * 60 * 60 * 1000;
      
      // Check if task will fit in current day
      const taskEndTime = new Date(currentDate.getTime() + taskDurationMs);
      
      // If task ends after 5 PM, move to next day
      if (taskEndTime > endOfDay) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(9, 0, 0, 0);
      }
      
      // Set scheduled start and end
      const scheduledStart = new Date(currentDate);
      const scheduledEnd = new Date(currentDate.getTime() + taskDurationMs);
      
      // Log task scheduling details
      console.log(`Scheduling task '${task.title}' (ID: ${task.id}):`, {
        estimatedHours: task.estimatedHours,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString()
      });
      
      // Update task
      const updatedTask = { 
        ...task, 
        scheduledStart, 
        scheduledEnd 
      };
      this.tasks.set(task.id, updatedTask);
      
      // Move current date to end of this task
      currentDate = new Date(scheduledEnd);
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
