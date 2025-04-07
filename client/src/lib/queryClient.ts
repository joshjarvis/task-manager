import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Type definition for Electron API exposed via contextBridge
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  saveTasks: (tasks: any[]) => Promise<{success: boolean, error?: string}>;
  loadTasks: () => Promise<{success: boolean, data: any[], error?: string}>;
}

// Add Electron API to window object for TypeScript
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

// Check if we're running in Electron
const isElectron = window.electron !== undefined;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // For Electron desktop app - handle task API locally
  if (isElectron && url.startsWith('/api/tasks')) {
    let response: any;
    
    // Process local task management
    if (method === 'GET' && url === '/api/tasks') {
      const result = await window.electron!.loadTasks();
      if (!result.success) throw new Error(result.error);
      
      // Create a mock response
      return {
        ok: true,
        status: 200,
        json: async () => result.data,
      } as Response;
    } 
    else if (method === 'POST' && url === '/api/tasks') {
      // Logic to add a new task to local storage
      const tasks = await getLocalTasks();
      const newTask = { ...data as any, id: Date.now() }; // Generate a unique ID
      tasks.push(newTask);
      await saveLocalTasks(tasks);
      
      return {
        ok: true,
        status: 201,
        json: async () => newTask,
      } as Response;
    }
    else if (method === 'PATCH' && url.startsWith('/api/tasks/')) {
      // Update an existing task
      const taskId = parseInt(url.split('/').pop() || '0');
      const tasks = await getLocalTasks();
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        return {
          ok: false,
          status: 404,
          statusText: 'Task not found',
        } as Response;
      }

      tasks[taskIndex] = { ...tasks[taskIndex], ...data as object };
      await saveLocalTasks(tasks);
      
      return {
        ok: true,
        status: 200,
        json: async () => tasks[taskIndex],
      } as Response;
    }
    else if (method === 'DELETE' && url.startsWith('/api/tasks/')) {
      // Delete a task
      const taskId = parseInt(url.split('/').pop() || '0');
      const tasks = await getLocalTasks();
      const newTasks = tasks.filter(t => t.id !== taskId);
      
      if (newTasks.length === tasks.length) {
        return {
          ok: false,
          status: 404,
          statusText: 'Task not found',
        } as Response;
      }
      
      await saveLocalTasks(newTasks);
      
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response;
    }
  }

  // Default behavior - use API server
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

// Helper function to get tasks from local storage
async function getLocalTasks(): Promise<any[]> {
  if (!isElectron) return [];
  
  const result = await window.electron!.loadTasks();
  if (!result.success) throw new Error(result.error);
  return result.data || [];
}

// Helper function to save tasks to local storage
async function saveLocalTasks(tasks: any[]): Promise<void> {
  if (!isElectron) return;
  
  const result = await window.electron!.saveTasks(tasks);
  if (!result.success) throw new Error(result.error);
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // For Electron desktop app - handle task API locally
    const url = queryKey[0] as string;
    if (isElectron && url === '/api/tasks') {
      const result = await window.electron!.loadTasks();
      if (!result.success) throw new Error(result.error);
      return result.data as T;
    }
    
    // Default behavior - use API server
    const res = await fetch(url, {
      credentials: "include",
    });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }
    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
