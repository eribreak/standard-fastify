/**
 * Standardized API response contract.
 *
 * Success:
 *   { success: true, data: <any>, meta: <object|null> }
 * Error:
 *   { success: false, error: { code, message, details } }
 *
 * `meta` is omitted (null) when there is no metadata to attach.
 */

/**
 * Send a success response.
 *
 * @param {import('fastify').FastifyReply} reply
 * @param {unknown} data
 * @param {object} [meta]
 * @param {number} [status=200]
 */
export function sendSuccess(reply, data, meta, status = 200) {
  const payload = { success: true, data, meta: meta || null };
  return reply.status(status).send(payload);
}

/**
 * Send a created response (HTTP 201).
 *
 * @param {import('fastify').FastifyReply} reply
 * @param {unknown} data
 * @param {object} [meta]
 */
export function sendCreated(reply, data, meta) {
  return sendSuccess(reply, data, meta, 201);
}

/**
 * Send a no-content response (HTTP 204).
 *
 * @param {import('fastify').FastifyReply} reply
 */
export function sendNoContent(reply) {
  return reply.status(204).send();
}

/**
 * Build a pagination meta object.
 *
 * @param {number} page
 * @param {number} limit
 * @param {number} totalItems
 * @returns {object}
 */
export function paginationMeta(page, limit, totalItems) {
  return {
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    },
  };
}

export default { sendSuccess, sendCreated, sendNoContent, paginationMeta };
