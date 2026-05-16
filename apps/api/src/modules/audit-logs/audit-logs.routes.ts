import { Router } from 'express';
import { db } from '../../db/index.js';
import { auditLogs, users } from '../../db/schema/index.js';
import { eq, and, desc, count, between, ilike } from 'drizzle-orm';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { sendSuccess } from '../../lib/response.js';

const router = Router();

router.get('/', requireAuth, requireRole(['super_admin', 'branch_admin']), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { table_name, record_id, action, changed_by, from, to } = req.query as any;

    let whereClause = undefined;
    
    if (table_name) {
      const typeLimit = eq(auditLogs.table_name, table_name);
      whereClause = whereClause ? and(whereClause, typeLimit) : typeLimit;
    }
    if (record_id) {
      const resLimit = eq(auditLogs.record_id, record_id);
      whereClause = whereClause ? and(whereClause, resLimit) : resLimit;
    }
    if (action) {
      const actLimit = eq(auditLogs.action, action);
      whereClause = whereClause ? and(whereClause, actLimit) : actLimit;
    }
    if (changed_by) {
      const userLimit = eq(auditLogs.changed_by, changed_by);
      whereClause = whereClause ? and(whereClause, userLimit) : userLimit;
    }
    if (from && to) {
      const dateLimit = between(auditLogs.created_at, new Date(from), new Date(to));
      whereClause = whereClause ? and(whereClause, dateLimit) : dateLimit;
    }

    const data = await db.select({
      log: auditLogs,
      user_full_name: users.full_name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.changed_by, users.user_id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(auditLogs.created_at));

    const totalRes = await db.select({ count: count() }).from(auditLogs).where(whereClause);

    sendSuccess(res, data.map(item => ({ ...item.log, user_full_name: item.user_full_name })), { total: totalRes[0].count, page, limit });
  } catch (error) {
    next(error);
  }
});

export default router;
