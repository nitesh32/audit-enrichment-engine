import { UPDATE_PATH_HEADER } from '../config/constants.js';
import { createEntrySchema, entryIdParamsSchema, updateEntrySchema } from '../validation/auditSchemas.js';
import { validate } from '../validation/validate.js';

const HTTP_ACCEPTED = 202;

/** HTTP only: parse the request, call a service, write the response. */
export class AuditController {
  constructor({ auditService, similarityService }) {
    this.auditService = auditService;
    this.similarityService = similarityService;
  }

  /** POST /api/audit-entries -> 202 with the PENDING entry */
  create = async (request, response) => {
    const payload = validate(createEntrySchema, request.body);
    const entry = await this.auditService.create(request.tenantId, payload);
    response.status(HTTP_ACCEPTED).json(entry);
  };

  /** GET /api/audit-entries */
  list = async (request, response) => {
    response.json(await this.auditService.list(request.tenantId));
  };

  /** GET /api/audit-entries/:id */
  get = async (request, response) => {
    const { id } = validate(entryIdParamsSchema, request.params);
    response.json(await this.auditService.get(request.tenantId, id));
  };

  /** PUT /api/audit-entries/:id -> { entry, path, changedFields, durationMs } */
  update = async (request, response) => {
    const { id } = validate(entryIdParamsSchema, request.params);
    const patch = validate(updateEntrySchema, request.body);
    const result = await this.auditService.update(request.tenantId, id, patch);
    response.set(UPDATE_PATH_HEADER, result.path).json(result);
  };

  /** POST /api/audit-entries/:id/similar -> top matches, most similar first */
  findSimilar = async (request, response) => {
    const { id } = validate(entryIdParamsSchema, request.params);
    response.json(await this.similarityService.findSimilar(request.tenantId, id));
  };
}
