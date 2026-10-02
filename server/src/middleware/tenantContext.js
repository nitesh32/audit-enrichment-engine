import { TENANT_HEADER } from '../config/constants.js';
import { tenantIdSchema } from '../validation/auditSchemas.js';
import { validate } from '../validation/validate.js';

/**
 * Single-tenant demo: scopes every request to the X-Tenant-Id header, or to
 * the configured default tenant.
 */
export function tenantContext(defaultTenantId) {
  return (request, _response, next) => {
    request.tenantId = validate(tenantIdSchema, request.get(TENANT_HEADER) ?? defaultTenantId);
    next();
  };
}
