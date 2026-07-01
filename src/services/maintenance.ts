import { addDays, nowISO } from '@/helpers/date';
import { supabase } from '@/helpers/supabase';
import { getCurrentUserId } from '@/helpers/supabase';
import type { MaintenanceLog, MaintenanceScope, MaintenanceTask, ScheduleKind } from '@/types/database';

export type MaintenanceTaskRow = Awaited<ReturnType<typeof listTasks>>[number];

export async function listTasks(scope: MaintenanceScope, filters?: { search?: string }) {
  let query = supabase
    .from('maintenance_tasks')
    .select('*, vehicles(brand_model, plate_number)')
    .eq('scope', scope)
    .eq('active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters?.search) {
    query = query.ilike('task_type', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createTask(
  tenantId: string,
  branchId: string,
  data: {
    scope: MaintenanceScope;
    vehicle_id?: string | null;
    task_type: string;
    schedule_kind: ScheduleKind;
    interval_days?: number | null;
    interval_usage?: number | null;
    last_done_at?: string | null;
    next_due_at?: string | null;
  },
): Promise<MaintenanceTask> {
  const { data: row, error } = await supabase
    .from('maintenance_tasks')
    .insert({ tenant_id: tenantId, branch_id: branchId, ...data })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return row;
}

export async function updateTask(
  id: string,
  data: Partial<{
    task_type: string;
    schedule_kind: ScheduleKind;
    interval_days: number | null;
    interval_usage: number | null;
    last_done_at: string | null;
    next_due_at: string | null;
    active: boolean;
  }>,
): Promise<MaintenanceTask> {
  const { data: row, error } = await supabase.from('maintenance_tasks').update(data).eq('id', id).select().single();

  if (error) {
    throw error;
  }

  return row;
}

export async function deleteTask(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from('maintenance_tasks').update({ deleted_at: nowISO(), deleted_by: userId }).eq('id', id);

  if (error) {
    throw error;
  }
}

export async function listLogs(taskId: string): Promise<MaintenanceLog[]> {
  const { data, error } = await supabase.from('maintenance_logs').select('*').eq('task_id', taskId).order('performed_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createLog(data: {
  task_id: string;
  performed_at: string;
  cost_centavos?: number | null;
  notes?: string | null;
}): Promise<MaintenanceLog> {
  // Fetch task to compute next_due_at
  const { data: task, error: taskError } = await supabase.from('maintenance_tasks').select('*').eq('id', data.task_id).single();

  if (taskError) {
    throw taskError;
  }

  const { data: log, error } = await supabase
    .from('maintenance_logs')
    .insert({
      task_id: data.task_id,
      tenant_id: task.tenant_id,
      branch_id: task.branch_id,
      performed_at: data.performed_at,
      cost_centavos: data.cost_centavos ?? null,
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const nextDue = computeNextDue(task, data.performed_at);

  await supabase
    .from('maintenance_tasks')
    .update({
      last_done_at: data.performed_at,
      next_due_at: nextDue,
    })
    .eq('id', data.task_id);

  return log;
}

export function computeNextDue(task: MaintenanceTask, logDate: string): string | null {
  if (task.schedule_kind === 'time' && task.interval_days) {
    return addDays(logDate, task.interval_days);
  }

  return null;
}
