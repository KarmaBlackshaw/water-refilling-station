export interface Vehicle {
  id: string;
  tenant_id: string;
  branch_id: string;
  type: string;
  brand_model: string | null;
  plate_number: string | null;
  year: number | null;
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}
