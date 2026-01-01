import { useCallback, useEffect, useState } from "react";
import { Task } from "../domain/tasks";
import { listTasks } from "./tasksStore";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    const t = await listTasks();
    setTasks(t);
    setHydrated(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tasks, hydrated, refresh };
}
