export type ContainerMovementType = 'out' | 'in' | 'lost' | 'adjustment';

export interface ContainerMovement {
  id: string;
  tenant_id: string;
  branch_id: string;
  customer_id: string | null;
  container_type_id: string;
  sale_id: string | null;
  movement_type: ContainerMovementType;
  quantity: number;
  movement_date: string;
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}
