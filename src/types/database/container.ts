import type { Database } from './supabase';

export type ContainerMovementType = Database['public']['Enums']['container_movement_type'];

export type ContainerMovement = Database['public']['Tables']['container_movements']['Row'];
