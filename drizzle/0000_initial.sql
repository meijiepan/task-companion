CREATE TABLE projects (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  selected_task_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX projects_user_updated ON projects(user_id, updated_at);
CREATE TABLE tasks (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  parent_id TEXT,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX tasks_user_project ON tasks(user_id, project_id, sort_order);
CREATE INDEX tasks_parent ON tasks(user_id, project_id, parent_id);
