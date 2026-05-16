import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'view_financials';
export type Subjects = 
  | 'Hospital' 
  | 'User' 
  | 'Asset' 
  | 'FaultReport' 
  | 'MaintenanceLog' 
  | 'QrCode' 
  | 'Vendor' 
  | 'ComplianceDoc' 
  | 'Report' 
  | 'AuditLog' 
  | 'SparePart' 
  | 'AmcContract'
  | 'Finance'
  | 'Inventory'
  | 'MaintenanceSchedule'
  | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export interface AuthUser {
  user_id: string;
  role: 'super_admin' | 'branch_admin' | 'supervisor' | 'technician' | 'auditor' | 'vendor';
  hospital_id: string | null;
  department: string | null;
  email: string;
}

export function defineAbilityFor(user: AuthUser) {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (user.role === 'super_admin') {
    can('manage', 'all');
  } 
  
  else if (user.role === 'branch_admin') {
    if (user.hospital_id) {
      // Full access to branch resources
      can('manage', 'Asset', { hospital_id: user.hospital_id } as any);
      can('manage', 'QrCode', { hospital_id: user.hospital_id } as any);
      can('manage', 'FaultReport', { hospital_id: user.hospital_id } as any);
      can('manage', 'MaintenanceLog', { hospital_id: user.hospital_id } as any);
      can('manage', 'Vendor', { hospital_id: user.hospital_id } as any);
      can('manage', 'ComplianceDoc', { hospital_id: user.hospital_id } as any);
      can('manage', 'AmcContract', { hospital_id: user.hospital_id } as any);
      can('manage', 'SparePart', { hospital_id: user.hospital_id } as any);
      can('manage', 'Inventory', { hospital_id: user.hospital_id } as any);
      can('manage', 'MaintenanceSchedule', { hospital_id: user.hospital_id } as any);
      can('export', 'Report', { hospital_id: user.hospital_id } as any);
      
      // Partial access to others
      can('manage', 'User', { hospital_id: user.hospital_id } as any); // Manage branch users
      can('read', 'AuditLog', { hospital_id: user.hospital_id } as any); // View branch audit logs
      can('view_financials', 'Finance', { hospital_id: user.hospital_id } as any); // View branch financials
    }
  } 
  
  else if (user.role === 'supervisor') {
    if (user.hospital_id) {
      const scope = user.department 
        ? { hospital_id: user.hospital_id, department: user.department } 
        : { hospital_id: user.hospital_id };

      can('read', 'Asset', scope as any);
      can('create', 'FaultReport', { hospital_id: user.hospital_id } as any);
      can('read', 'FaultReport', scope as any);
      can('update', 'FaultReport', scope as any);
      can('read', 'MaintenanceLog', scope as any); // View service logs
      can('update', 'MaintenanceLog', scope as any);
      can('approve', 'MaintenanceLog', scope as any); // Approve job cards
      
      // Partial/Limited
      can('read', 'Vendor', { hospital_id: user.hospital_id } as any); // See vendor details (Partial)
      can('read', 'Inventory', scope as any);
      can('read', 'MaintenanceSchedule', scope as any);
      can('export', 'Report', scope as any); // Export reports (Partial)

      // Explicitly Denied
      cannot('create', 'Asset');
      cannot('update', 'Asset');
      cannot('manage', 'User');
      cannot('view_financials', 'Finance');
      cannot('read', 'AuditLog');
    }
  } 
  
  else if (user.role === 'technician') {
    if (user.hospital_id) {
      can('read', 'Asset', { hospital_id: user.hospital_id } as any); // Scan QR -> view asset
      can('create', 'FaultReport', { hospital_id: user.hospital_id } as any);
      can('read', 'FaultReport', { hospital_id: user.hospital_id } as any);
      
      // Partial service log access (only assigned or basic info)
      can('read', 'MaintenanceLog', { hospital_id: user.hospital_id } as any);
      can('update', 'MaintenanceLog', { assigned_to: user.user_id } as any);
      can('read', 'Inventory', { hospital_id: user.hospital_id } as any);
      can('read', 'MaintenanceSchedule', { hospital_id: user.hospital_id } as any);

      // Denied
      cannot('create', 'Asset');
      cannot('approve', 'MaintenanceLog');
      cannot('manage', 'User');
      cannot('read', 'Vendor');
      cannot('view_financials', 'Finance');
      cannot('export', 'Report');
      cannot('read', 'AuditLog');
      cannot('manage', 'QrCode');
    }
  } 
  
  else if (user.role === 'auditor') {
    can('read', 'all');
    can('view_financials', 'Finance');
    can('export', 'Report');
    can('read', 'AuditLog');
    
    // Explicitly cannot modify
    cannot('create', 'all');
    cannot('update', 'all');
    cannot('delete', 'all');
  } 
  
  else if (user.role === 'vendor') {
    // Partial access to assets under their AMC
    can('read', 'Asset', { vendor_id: user.user_id } as any); 
    can('read', 'Vendor', { user_id: user.user_id } as any); // See own details
    can('read', 'MaintenanceLog', { vendor_id: user.user_id } as any); // View service logs
    can('update', 'MaintenanceLog', { vendor_id: user.user_id } as any); // Update service log
    
    // Denied
    cannot('create', 'FaultReport');
    cannot('approve', 'MaintenanceLog');
    cannot('view_financials', 'Finance');
    cannot('manage', 'User');
  }

  return build();
}
