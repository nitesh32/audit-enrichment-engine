import { Router } from 'express';

export function createAuditRoutes(controller) {
  const router = Router();
  router.route('/').get(controller.list).post(controller.create);
  router.route('/:id').get(controller.get).put(controller.update);
  router.post('/:id/similar', controller.findSimilar);
  return router;
}
