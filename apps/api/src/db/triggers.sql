CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
    record_id UUID;
    v_changed_by UUID;
BEGIN
    -- Try to get current user from a session variable if set (e.g. by the API)
    -- But since we are using plain SQL, we might not have it easily without a setter.
    -- For now, we'll rely on the API to pass changed_by if it's doing manual inserts,
    -- but for triggers, we might leave it null or set it via a session variable.
    
    IF (TG_OP = 'DELETE') THEN
        record_id := (row_to_json(OLD)->>(TG_TABLE_NAME || '_id'))::UUID;
        IF record_id IS NULL THEN
            IF (TG_TABLE_NAME = 'compliance_documents') THEN record_id := OLD.doc_id;
            ELSIF (TG_TABLE_NAME = 'maintenance_logs') THEN record_id := OLD.log_id;
            ELSIF (TG_TABLE_NAME = 'qr_codes') THEN record_id := OLD.qr_id;
            ELSIF (TG_TABLE_NAME = 'scan_events') THEN record_id := OLD.scan_id;
            ELSIF (TG_TABLE_NAME = 'fault_reports') THEN record_id := OLD.fault_id;
            ELSIF (TG_TABLE_NAME = 'maintenance_schedules') THEN record_id := OLD.schedule_id;
            ELSIF (TG_TABLE_NAME = 'amc_contracts') THEN record_id := OLD.contract_id;
            ELSIF (TG_TABLE_NAME = 'asset_assignments') THEN record_id := OLD.assignment_id;
            ELSIF (TG_TABLE_NAME = 'spare_parts') THEN record_id := OLD.part_id;
            ELSIF (TG_TABLE_NAME = 'asset_categories') THEN record_id := OLD.category_id;
            END IF;
        END IF;

        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, created_at)
        VALUES (TG_TABLE_NAME, record_id, 'DELETE', row_to_json(OLD), NULL, now());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        record_id := (row_to_json(NEW)->>(TG_TABLE_NAME || '_id'))::UUID;
        IF record_id IS NULL THEN
            IF (TG_TABLE_NAME = 'compliance_documents') THEN record_id := NEW.doc_id;
            ELSIF (TG_TABLE_NAME = 'maintenance_logs') THEN record_id := NEW.log_id;
            ELSIF (TG_TABLE_NAME = 'qr_codes') THEN record_id := NEW.qr_id;
            ELSIF (TG_TABLE_NAME = 'scan_events') THEN record_id := NEW.scan_id;
            ELSIF (TG_TABLE_NAME = 'fault_reports') THEN record_id := NEW.fault_id;
            ELSIF (TG_TABLE_NAME = 'maintenance_schedules') THEN record_id := NEW.schedule_id;
            ELSIF (TG_TABLE_NAME = 'amc_contracts') THEN record_id := NEW.contract_id;
            ELSIF (TG_TABLE_NAME = 'asset_assignments') THEN record_id := NEW.assignment_id;
            ELSIF (TG_TABLE_NAME = 'spare_parts') THEN record_id := NEW.part_id;
            ELSIF (TG_TABLE_NAME = 'asset_categories') THEN record_id := NEW.category_id;
            END IF;
        END IF;

        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, created_at)
        VALUES (TG_TABLE_NAME, record_id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), now());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        record_id := (row_to_json(NEW)->>(TG_TABLE_NAME || '_id'))::UUID;
        IF record_id IS NULL THEN
            IF (TG_TABLE_NAME = 'compliance_documents') THEN record_id := NEW.doc_id;
            ELSIF (TG_TABLE_NAME = 'maintenance_logs') THEN record_id := NEW.log_id;
            ELSIF (TG_TABLE_NAME = 'qr_codes') THEN record_id := NEW.qr_id;
            ELSIF (TG_TABLE_NAME = 'scan_events') THEN record_id := NEW.scan_id;
            ELSIF (TG_TABLE_NAME = 'fault_reports') THEN record_id := NEW.fault_id;
            ELSIF (TG_TABLE_NAME = 'maintenance_schedules') THEN record_id := NEW.schedule_id;
            ELSIF (TG_TABLE_NAME = 'amc_contracts') THEN record_id := NEW.contract_id;
            ELSIF (TG_TABLE_NAME = 'asset_assignments') THEN record_id := NEW.assignment_id;
            ELSIF (TG_TABLE_NAME = 'spare_parts') THEN record_id := NEW.part_id;
            ELSIF (TG_TABLE_NAME = 'asset_categories') THEN record_id := NEW.category_id;
            END IF;
        END IF;

        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, created_at)
        VALUES (TG_TABLE_NAME, record_id, 'INSERT', NULL, row_to_json(NEW), now());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name IN ('hospitals', 'users', 'assets', 'locations', 'asset_categories', 'vendors', 'qr_codes', 'fault_reports', 'maintenance_logs', 'compliance_documents', 'amc_contracts', 'spare_parts')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I_audit_trigger ON %I', t, t);
        EXECUTE format('CREATE TRIGGER %I_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION log_audit_changes()', t, t);
    END LOOP;
END;
$$;
