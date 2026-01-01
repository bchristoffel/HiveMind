import * as SQLite from "expo-sqlite";

export type DB = SQLite.SQLiteDatabase;

let db: DB | null = null;

export function getDb(): DB {
  if (!db) {
    db = SQLite.openDatabase("hivemind.db");
  }
  return db;
}

export function initDb(): Promise<void> {
  const database = getDb();
  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY NOT NULL,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          title TEXT NOT NULL,
          notes TEXT,
          status TEXT NOT NULL,
          completedAt INTEGER,
          dueAt INTEGER,
          sourceNoteId TEXT,
          priority TEXT
        );`,
        [],
        () => resolve(),
        (_tx, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}
