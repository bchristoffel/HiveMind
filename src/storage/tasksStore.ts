import { getDb, initDb } from "./db/client";
import { Task } from "../domain/tasks";

function rowToTask(row: any): Task {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    title: row.title,
    notes: row.notes ?? undefined,
    status: row.status,
    completedAt: row.completedAt ?? undefined,
    dueAt: row.dueAt ?? undefined,
    sourceNoteId: row.sourceNoteId ?? undefined,
    priority: row.priority ?? undefined,
  };
}

export async function ensureTasksDb() {
  await initDb();
}

export async function listTasks(): Promise<Task[]> {
  await ensureTasksDb();
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM tasks ORDER BY
          CASE WHEN status = 'open' THEN 0 ELSE 1 END,
          COALESCE(dueAt, 9999999999999) ASC,
          createdAt DESC;`,
        [],
        (_tx, res) => {
          const out: Task[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(rowToTask(res.rows.item(i)));
          resolve(out);
        },
        (_tx, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

export async function createTask(input: {
  title: string;
  notes?: string;
  dueAt?: number;
  sourceNoteId?: string;
  priority?: "low" | "med" | "high";
}): Promise<Task> {
  await ensureTasksDb();
  const db = getDb();

  const now = Date.now();
  const id =
    (globalThis.crypto as any)?.randomUUID?.() ?? `${now}-${Math.random().toString(16).slice(2)}`;

  const task: Task = {
    id,
    createdAt: now,
    updatedAt: now,
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    status: "open",
    dueAt: input.dueAt,
    sourceNoteId: input.sourceNoteId,
    priority: input.priority,
  };

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO tasks
        (id, createdAt, updatedAt, title, notes, status, completedAt, dueAt, sourceNoteId, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          task.id,
          task.createdAt,
          task.updatedAt,
          task.title,
          task.notes ?? null,
          task.status,
          task.completedAt ?? null,
          task.dueAt ?? null,
          task.sourceNoteId ?? null,
          task.priority ?? null,
        ],
        () => resolve(task),
        (_tx, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

export async function setTaskDone(taskId: string, done: boolean): Promise<void> {
  await ensureTasksDb();
  const db = getDb();

  const now = Date.now();
  const status = done ? "done" : "open";
  const completedAt = done ? now : null;

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `UPDATE tasks SET status = ?, completedAt = ?, updatedAt = ? WHERE id = ?;`,
        [status, completedAt, now, taskId],
        () => resolve(),
        (_tx, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await ensureTasksDb();
  const db = getDb();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `DELETE FROM tasks WHERE id = ?;`,
        [taskId],
        () => resolve(),
        (_tx, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}
