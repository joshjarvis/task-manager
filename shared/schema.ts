import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type Priority = "low" | "medium" | "high";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  estimatedHours: numeric("estimated_hours").notNull(),
  priority: text("priority").notNull().$type<Priority>(),
  dueDate: timestamp("due_date").notNull(),
  completed: integer("completed").default(0).notNull(),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Extend the schema with validation
export const taskFormSchema = insertTaskSchema.extend({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  estimatedHours: z.number().min(0.25, "Task must be at least 15 minutes"),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
});

export type TaskWithId = Task;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
