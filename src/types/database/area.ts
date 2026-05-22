export interface Area {
  id: string;
  tenant_id: string;
  branch_id: string;
  name: string;
  notes: string | null;
  primary_rider_id: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface AreaCoverageRecord {
  id: string;
  tenant_id: string;
  branch_id: string;
  area_id: string;
  covering_rider_id: string;
  starts_on: string;
  ends_on: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}
