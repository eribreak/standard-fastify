/** @type {import('json-schema').Schema} */
export const cacheGetSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            value: {},
            cached: { type: 'boolean' },
            redisAvailable: { type: 'boolean' },
          },
          required: ['key', 'value', 'cached', 'redisAvailable'],
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
export const cacheSetSchema = {
  body: {
    type: 'object',
    properties: {
      value: {},
    },
    required: ['value'],
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'object',
          properties: { key: { type: 'string' }, stored: { type: 'boolean' } },
        },
        meta: { type: 'null' },
      },
      required: ['success', 'data', 'meta'],
      additionalProperties: false,
    },
  },
};

/** @type {import('json-schema').Schema} */
export const cacheDelSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'object',
          properties: { key: { type: 'string' }, deleted: { type: 'number' } },
        },
        meta: { type: 'null' },
      },
      required: ['success', 'data', 'meta'],
      additionalProperties: false,
    },
  },
};

/** @type {import('json-schema').Schema} */
export const cacheListSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            keys: { type: 'array', items: { type: 'string' } },
            redisAvailable: { type: 'boolean' },
          },
          required: ['pattern', 'keys', 'redisAvailable'],
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
export const workerPrimeSchema = {
  body: {
    type: 'object',
    properties: {
      limit: { type: 'number' },
    },
    required: ['limit'],
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'object',
          properties: {
            limit: { type: 'number' },
            count: { type: 'number' },
            workerUsed: { type: 'boolean' },
            durationMs: { type: 'number' },
          },
          required: ['limit', 'count', 'workerUsed', 'durationMs'],
          additionalProperties: false,
        },
        meta: { type: 'null' },
      },
      required: ['success', 'data', 'meta'],
      additionalProperties: false,
    },
    422: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'null' },
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

/** @type {import('json-schema').Schema} */
export const workerPoolSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'object',
          properties: {
            size: { type: 'number' },
            pending: { type: 'number' },
          },
          required: ['size', 'pending'],
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
export const traceSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'object',
          properties: {
            traceId: { type: ['string', 'null'] },
            spanId: { type: ['string', 'null'] },
            otelEnabled: { type: 'boolean' },
          },
          required: ['traceId', 'spanId', 'otelEnabled'],
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
export const traceSpanSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', const: true },
        data: {
          type: 'object',
          properties: {
            traceId: { type: 'string' },
            parentSpanId: { type: ['string', 'null'] },
            childSpanId: { type: 'string' },
            childName: { type: 'string' },
            durationMs: { type: 'number' },
          },
          required: ['traceId', 'parentSpanId', 'childSpanId', 'childName', 'durationMs'],
          additionalProperties: false,
        },
        meta: { type: 'null' },
      },
      required: ['success', 'data', 'meta'],
      additionalProperties: false,
    },
  },
};

export default {
  cacheGetSchema,
  cacheSetSchema,
  cacheDelSchema,
  cacheListSchema,
  workerPrimeSchema,
  workerPoolSchema,
  traceSchema,
  traceSpanSchema,
};
