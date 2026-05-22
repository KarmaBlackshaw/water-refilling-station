export type MaintenanceScope = 'water_plant' | 'vehicle';
export type ScheduleKind = 'time' | 'usage';

export interface MaintenanceTask {
  id: string;
  tenant_id: string;
  branch_id: string;
  scope: MaintenanceScope;
  vehicle_id: string | null;
  task_type: string;
  schedule_kind: ScheduleKind;
  interval_days: number | null;
  interval_usage: number | null;
  last_done_at: string | null;
  next_due_at: string | null;
  active: boolean;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface MaintenanceLog {
  id: string;
  tenant_id: string;
  branch_id: string;
  task_id: string;
  performed_at: string;
  performed_by: string | null;
  cost_centavos: number | null;
  notes: string | null;
  created_at: string;
}
