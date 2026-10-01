/**
 * JSON Schema validation with readable errors. Wraps the vendored validator so
 * the rest of the code sees only { path, message } pairs, where path is a
 * dotted field path such as "levels.3" or "evidence.0.date". A schema may give
 * a pattern a "patternDescription" annotation to name it in messages.
 */
import { Validator } from '@cfworker/json-schema';

/** @typedef {{ path: string, message: string }} SchemaError */

/** Keywords that only report that something nested failed. */
const WRAPPERS = new Set([
  'properties', 'items', 'prefixItems', 'allOf', 'anyOf', 'oneOf', '$ref',
  'false', 'unevaluatedProperties', 'unevaluatedItems', 'contains', 'patternProperties',
]);

/** @type {WeakMap<object, Validator>} */
const validators = new WeakMap();

/**
 * @param {object} schema
 * @param {unknown} data
 * @returns {SchemaError[]}
 */
export function validateSchema(schema, data) {
  let validator = validators.get(schema);
  if (!validator) {
    validator = new Validator(/** @type {any} */ (schema), '2020-12', false);
    validators.set(schema, validator);
  }
  /** @type {SchemaError[]} */
  const out = [];
  for (const e of validator.validate(data).errors) {
    if (WRAPPERS.has(e.keyword) || e.keywordLocation.includes('/propertyNames/')) continue;
    const at = pointerToPath(e.instanceLocation);
    const join = (/** @type {string} */ name) => (at ? `${at}.${name}` : name);
    const quoted = /"([^"]*)"/.exec(e.error)?.[1] ?? '';
    if (e.keyword === 'required') {
      out.push({ path: join(quoted), message: `missing required field "${quoted}"` });
    } else if (e.keyword === 'additionalProperties') {
      const parent = schemaAt(schema, e.keywordLocation.replace(/\/additionalProperties$/, ''));
      if (parent?.additionalProperties === false && !(quoted in (parent.properties ?? {}))) {
        out.push({ path: join(quoted), message: `unknown field "${quoted}"` });
      }
    } else if (e.keyword === 'propertyNames') {
      out.push({ path: at, message: `field name "${quoted}" is not allowed here` });
    } else if (e.keyword === 'pattern') {
      const node = schemaAt(schema, e.keywordLocation.replace(/\/pattern$/, ''));
      const what = node?.patternDescription ? `the pattern for ${node.patternDescription}` : `the pattern ${node?.pattern}`;
      out.push({ path: at, message: `${JSON.stringify(valueAt(data, e.instanceLocation))} does not match ${what}` });
    } else if (e.keyword === 'const') {
      const node = schemaAt(schema, e.keywordLocation.replace(/\/const$/, ''));
      out.push({ path: at, message: `must be ${JSON.stringify(node?.const)}` });
    } else if (e.keyword === 'enum') {
      const node = schemaAt(schema, e.keywordLocation.replace(/\/enum$/, ''));
      out.push({ path: at, message: `must be one of ${(node?.enum ?? []).join(', ')}` });
    } else {
      out.push({ path: at, message: e.error });
    }
  }
  return out;
}

/** @param {string} pointer a JSON pointer fragment such as "#/levels/3" */
function segments(pointer) {
  return pointer
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((s) => decodeURIComponent(s).replace(/~1/g, '/').replace(/~0/g, '~'));
}

/** @param {string} pointer */
function pointerToPath(pointer) {
  return segments(pointer).join('.');
}

/**
 * @param {any} schema
 * @param {string} pointer
 */
function schemaAt(schema, pointer) {
  let node = schema;
  for (const s of segments(pointer)) {
    node = s === '$ref' && typeof node?.$ref === 'string' && node.$ref.startsWith('#') ? schemaAt(schema, node.$ref) : node?.[s];
  }
  return node;
}

/**
 * @param {any} data
 * @param {string} pointer
 */
function valueAt(data, pointer) {
  let node = data;
  for (const s of segments(pointer)) node = node?.[s];
  return node;
}
