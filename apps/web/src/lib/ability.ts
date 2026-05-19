import { createMongoAbility, type MongoAbility } from '@casl/ability';
import { createContext } from 'react';
import { createContextualCan } from '@casl/react';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'view_financials';
export type Subjects = 
  | 'Hospital' 
  | 'User' 
  | 'Asset' 
  | 'FaultReport' 
  | 'MaintenanceLog' 
  | 'MaintenanceSchedule'
  | 'QrCode' 
  | 'Vendor' 
  | 'ComplianceDoc' 
  | 'Report' 
  | 'AuditLog' 
  | 'SparePart' 
  | 'AmcContract'
  | 'Finance'
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export const ability = createMongoAbility<AppAbility>();

export const AbilityContext = createContext<AppAbility>(ability);
export const Can = createContextualCan(AbilityContext.Consumer);
