import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { taskFormSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  const apiRouter = express.Router();
  
  // Get all tasks
  apiRouter.get("/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve tasks" });
    }
  });
  
  // Get single task
  apiRouter.get("/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve task" });
    }
  });
  
  // Create task
  apiRouter.post("/tasks", async (req, res) => {
    try {
      // Validate task data
      const taskData = taskFormSchema.parse({
        ...req.body,
        // Convert string date to Date object
        dueDate: new Date(req.body.dueDate),
      });
      
      // Create task
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details 
        });
      }
      
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  
  // Update task
  apiRouter.patch("/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if task exists
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Convert dueDate to Date if provided
      const updateData = { ...req.body };
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      
      // Update task
      const updatedTask = await storage.updateTask(id, updateData);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  
  // Delete task
  apiRouter.delete("/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if task exists
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Delete task
      const deleted = await storage.deleteTask(id);
      
      if (deleted) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete task" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  
  // Manually trigger task scheduling
  apiRouter.post("/tasks/schedule", async (req, res) => {
    try {
      const scheduledTasks = await storage.scheduleTasks();
      res.json(scheduledTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to schedule tasks" });
    }
  });
  
  // Mount API routes
  app.use("/api", apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
