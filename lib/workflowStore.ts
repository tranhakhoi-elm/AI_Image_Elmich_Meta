import fs from 'fs/promises';
import path from 'path';
import { getFirestore } from './googleCloud.js';

export interface SavedWorkflow {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  nodes: any[];
  edges: any[];
}

const WORKFLOWS_DIR = path.resolve(process.cwd(), 'data', 'workflows');

// Ensure directory exists
async function ensureWorkflowsDir() {
  try {
    await fs.mkdir(WORKFLOWS_DIR, { recursive: true });
  } catch (err: any) {
    console.error('Error ensuring workflows directory:', err.message);
  }
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * List all workflows saved on the server
 */
export async function listServerWorkflows(): Promise<SavedWorkflow[]> {
  await ensureWorkflowsDir();

  const workflowsMap = new Map<string, SavedWorkflow>();

  // 1. Read from local filesystem
  try {
    const files = await fs.readdir(WORKFLOWS_DIR);
    for (const file of files) {
      if (!file.endsWith('.json') || file === 'index.json') continue;
      try {
        const filePath = path.join(WORKFLOWS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed: SavedWorkflow = JSON.parse(content);
        if (parsed && parsed.id && parsed.name && Array.isArray(parsed.nodes)) {
          workflowsMap.set(parsed.id, parsed);
        }
      } catch (readErr: any) {
        console.warn(`Could not read workflow file ${file}:`, readErr.message);
      }
    }
  } catch (err: any) {
    console.error('Error reading workflows directory:', err.message);
  }

  // 2. Read from Firestore if available (with strict 1s timeout to prevent hanging)
  const db = getFirestore();
  if (db) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore query timeout')), 1000)
      );
      const snapshot: any = await Promise.race([
        db.collection('canvas_workflows').orderBy('updatedAt', 'desc').get(),
        timeoutPromise,
      ]);
      snapshot.forEach((doc: any) => {
        const data = doc.data() as SavedWorkflow;
        if (data && data.id && !workflowsMap.has(data.id)) {
          workflowsMap.set(data.id, data);
        }
      });
    } catch (fsErr: any) {
      // Gracefully continue with local filesystem data
    }
  }

  const list = Array.from(workflowsMap.values());
  // Sort descending by updatedAt
  list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return list;
}

/**
 * Save or update a workflow on the server filesystem (and Firestore if available)
 */
export async function saveServerWorkflow(workflow: SavedWorkflow): Promise<SavedWorkflow> {
  await ensureWorkflowsDir();

  const now = Date.now();
  const id = workflow.id || `wf-${now}-${Math.random().toString(36).substring(2, 7)}`;
  const safeId = sanitizeId(id);

  const workflowRecord: SavedWorkflow = {
    id,
    name: workflow.name.trim() || 'Quy trình không tên',
    description: workflow.description?.trim() || '',
    createdAt: workflow.createdAt || now,
    updatedAt: now,
    nodes: Array.isArray(workflow.nodes) ? workflow.nodes : [],
    edges: Array.isArray(workflow.edges) ? workflow.edges : [],
  };

  // 1. Write to local filesystem
  try {
    const filePath = path.join(WORKFLOWS_DIR, `${safeId}.json`);
    await fs.writeFile(filePath, JSON.stringify(workflowRecord, null, 2), 'utf-8');
  } catch (err: any) {
    console.error(`Error saving workflow to disk (${safeId}.json):`, err.message);
    throw new Error(`Không thể ghi file quy trình lên server: ${err.message}`);
  }

  // 2. Save to Firestore if available (with 1.5s timeout)
  const db = getFirestore();
  if (db) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore save timeout')), 1500)
      );
      await Promise.race([
        db.collection('canvas_workflows').doc(id).set(workflowRecord),
        timeoutPromise,
      ]);
    } catch (fsErr: any) {
      // Non-fatal warning
    }
  }

  return workflowRecord;
}

/**
 * Delete a workflow from server filesystem and Firestore
 */
export async function deleteServerWorkflow(id: string): Promise<boolean> {
  await ensureWorkflowsDir();
  const safeId = sanitizeId(id);

  // 1. Delete from local filesystem (both direct safeId and scan any file with matching parsed.id)
  try {
    const directFile = path.join(WORKFLOWS_DIR, `${safeId}.json`);
    await fs.unlink(directFile).catch(() => {});
  } catch {
    // ignore
  }

  try {
    const files = await fs.readdir(WORKFLOWS_DIR);
    for (const file of files) {
      if (!file.endsWith('.json') || file === 'index.json') continue;
      const filePath = path.join(WORKFLOWS_DIR, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed?.id === id || file === `${safeId}.json` || file === `${id}.json`) {
          await fs.unlink(filePath).catch(() => {});
        }
      } catch {
        // ignore read error
      }
    }
  } catch (err: any) {
    console.error('Error scanning files to delete workflow:', err.message);
  }

  // 2. Delete from Firestore if available (with 1.5s timeout)
  const db = getFirestore();
  if (db) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore delete timeout')), 1500)
      );
      await Promise.race([
        db.collection('canvas_workflows').doc(id).delete(),
        timeoutPromise,
      ]);
    } catch (fsErr: any) {
      // Non-fatal warning
    }
  }

  return true;
}
