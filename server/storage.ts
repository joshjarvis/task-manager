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

    // Current time - with comprehensive timezone context
    const now = new Date();
    console.log("Current reference time:", {
      iso: now.toISOString(),
      utc: now.toUTCString(),
      local: now.toString(),
      hours: now.getHours(),
      minutes: now.getMinutes()
    });

    // Schedule each task with strict timezone consistency
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
      
      // RULE 1: STRICT WORKING HOURS (9 AM - 5 PM)
      // First, determine if we can use the due date time
      let useSpecificTime = false;
      
      if (dueHours >= 9 && dueHours < 17) {
        console.log(`Due time ${dueHours}:${dueMinutes} is within working hours (9 AM - 5 PM)`);
        // Apply due date's time to the scheduled date
        scheduledTime.setHours(dueHours, dueMinutes, 0, 0);
        useSpecificTime = true;
      } else {
        console.log(`Due time ${dueHours}:${dueMinutes} is outside working hours, will use 9 AM`);
        // Default to 9 AM start time
        scheduledTime.setHours(9, 0, 0, 0);
      }
      
      // RULE 2: NEVER SCHEDULE IN THE PAST
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
      
      // RULE 3: ENFORCE WORKING HOURS
      const currentHour = scheduledTime.getHours();
      if (currentHour < 9 || currentHour >= 17) {
        console.log(`Current hour ${currentHour} is outside working hours (9 AM - 5 PM)`);
        
        // If after work hours, move to next day
        if (currentHour >= 17) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
          console.log(`Moving to next day: ${scheduledTime.toDateString()}`);
        }
        
        // Set to 9 AM
        scheduledTime.setHours(9, 0, 0, 0);
        console.log(`Adjusted to 9 AM: ${scheduledTime.toLocaleTimeString()}`);
      }
      
      // Calculate task duration
      const taskDurationMs = Number(task.estimatedHours) * 60 * 60 * 1000;
      
      // RULE 4: TASKS MUST FIT WITHIN WORKING HOURS
      // Define end of working day (5 PM)
      const endOfWorkDay = new Date(scheduledTime);
      endOfWorkDay.setHours(17, 0, 0, 0);
      
      // Calculate when the task would end
      const tentativeEndTime = new Date(scheduledTime.getTime() + taskDurationMs);
      
      if (tentativeEndTime > endOfWorkDay) {
        console.log("Task would extend beyond 5 PM, moving to next working day");
        scheduledTime.setDate(scheduledTime.getDate() + 1);
        scheduledTime.setHours(9, 0, 0, 0);
        console.log(`New scheduled start: ${scheduledTime.toISOString()}`);
      }
      
      // Final scheduled times
      const scheduledStart = new Date(scheduledTime);
      const scheduledEnd = new Date(scheduledTime.getTime() + taskDurationMs);
      
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
