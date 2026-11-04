/**
 * JSON schemas for the health endpoints.
 *
 * Responses follow the standard API contract envelope
 * `{ success, data, meta }`.
 */

/** @type {import('json-schema').Schema} */
export const healthLiveSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok'] },
            uptime: { type: 'number' },
          },
          required: ['status', 'uptime'],
          additionalProperties: false,
        },
        meta: { type: 'null' },
      },
      required: ['success', 'data', 'meta'],
      additionalProperties: false,
    },
  },
};

/** @type {import('json-schema').Schema} */
export const healthReadySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok'] },
            database: { type: 'string', enum: ['ok'] },
          },
          required: ['status', 'database'],
          additionalProperties: false,
        },
        meta: { type: 'null' },
      },
      required: ['success', 'data', 'meta'],
      additionalProperties: false,
    },
    503: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', const: 'SERVICE_UNAVAILABLE' },
            message: { type: 'string' },
            details: {
              type: 'object',
              properties: { database: { type: 'string', enum: ['error'] } },
            },
          },
          required: ['code', 'message', 'details'],
          additionalProperties: false,
        },
      },
      required: ['success', 'error'],
      additionalProperties: false,
    },
  },
};

export default { healthLiveSchema, healthReadySchema };
