import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from './types.ts';

const GLOBAL = '_global_';
const key = (id: string) => ['projects', GLOBAL, id] as const;
const PREFIX = ['projects', GLOBAL] as const;

export const listProjects = async (kv: Deno.Kv): Promise<Project[]> => {
  const projects: Project[] = [];
  for await (const entry of kv.list<Project>({ prefix: PREFIX })) {
    if (entry.value) projects.push(entry.value);
  }
  return projects.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
};

export const getProjectById = async (
  kv: Deno.Kv,
  id: string,
): Promise<Project | null> => {
  const entry = await kv.get<Project>(key(id));
  return entry.value;
};

export const createProject = async (
  kv: Deno.Kv,
  input: CreateProjectInput,
): Promise<Project> => {
  const project: Project = {
    id: crypto.randomUUID(),
    name: input.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(project.id), project);
  return project;
};

export const updateProject = async (
  kv: Deno.Kv,
  id: string,
  input: UpdateProjectInput,
): Promise<Project | null> => {
  const existing = await getProjectById(kv, id);
  if (!existing) return null;

  const updated: Project = {
    ...existing,
    name: input.name,
    updatedAt: new Date().toISOString(),
  };
  await kv.set(key(id), updated);
  return updated;
};

export const deleteProject = async (
  kv: Deno.Kv,
  id: string,
): Promise<boolean> => {
  const exists = await getProjectById(kv, id);
  if (!exists) return false;
  await kv.delete(key(id));
  return true;
};
