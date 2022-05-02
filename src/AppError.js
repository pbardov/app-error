/* eslint-disable no-param-reassign */
import _ from 'lodash';

const destroyCircular = (obj, level = 0, circulars = new Set()) => {
  circulars.add(obj);

  if (typeof obj === 'function') return '[Function]';
  let it;
  if (_.isArray(obj)) it = obj.entries();
  else if (_.isObject(obj)) it = Object.entries(obj);

  if (it) {
    for (const [k, v] of it) {
      if (circulars.has(v)) obj[k] = '[Circular]';
      else if (_.isObject(v)) {
        try {
          obj[k] = destroyCircular(v, level + 1, new Set(circulars));
        } catch (error) {
          // console.warn(`destroyCircular: ${error?.message}`);
          obj[k] = '[CirularError]';
        }
      }
    }
  }

  return obj;
};

const spacer = (str, space = '  ') => _.split(str, /\n/)
  .map((s) => `${space}${s}`)
  .join('\n');

Error.stackTraceLimit = Infinity;

export default class AppError extends Error {
  static destroyCircular(...args) {
    return destroyCircular(...args);
  }

  static toJSON(error) {
    const {
      code, message, stack, ...extra
    } = error || {
      message: 'Unknown error',
      origin: error || null
    };
    const errorData = {
      code,
      message,
      stack,
      ...extra
    };
    destroyCircular(errorData);
    return errorData;
  }

  static wrap(error, extra = {}) {
    if (error instanceof AppError) {
      const {
        message, code, stack, ...origin
      } = error;
      Object.assign(error, {
        ...extra,
        ...origin,
        message,
        code,
        stack
      });
      error.destroyCircular();
      return error;
    }
    if (error instanceof Error || _.isPlainObject(error)) {
      const {
        message, code, stack, ...origin
      } = error;
      const wrapped = new this(message, {
        ...extra,
        ...origin,
        code,
        message,
        stack
      });
      wrapped.destroyCircular();
      return wrapped;
    }
    if (_.isString(error)) {
      const wrapped = new this(error, extra);
      wrapped.destroyCircular();
      return wrapped;
    }

    const wrapped = new this('Unknown error', { ...extra, origin: error });
    wrapped.destroyCircular();
    return wrapped;
  }

  constructor(errorMessage, {
    code, message, stack, ...extra
  } = {}) {
    super(message || errorMessage);
    Object.assign(this, {
      ...extra
    });
    if (code !== undefined) this.code = code;
    if (stack !== undefined) this.stack = stack;
    this.destroyCircular();
  }

  destroyCircular() {
    destroyCircular(this);
  }

  toString() {
    this.destroyCircular();
    const {
      code, message, stack, ...extra
    } = this;
    return JSON.stringify(
      {
        code,
        message,
        stack,
        ...extra
      },
      null,
      '  '
    );
  }

  toJSON() {
    return this.constructor.toJSON(this);
  }

  print(prefix, options) {
    const opts = !options && _.isObject(prefix) ? prefix : options || {};
    const { prefix: prfx = _.isString(prefix) ? prefix : 'Error', printf = (...args) => console.error(...args) } = opts;
    const {
      code, message = '', stack, ...extra
    } = this;
    printf(
      `${prfx}: ${code ? `(code: ${code}) ` : ''}${message}\nBacktrace: ${spacer(stack, '     ')}\n${
        _.isEmpty(extra) ? '' : `${JSON.stringify(extra, null, '   ')}`
      }`
    );
  }

  printWarn(prefix, options) {
    const opts = !options && _.isObject(prefix) ? prefix : options || {};
    const { prefix: prfx = _.isString(prefix) ? prefix : 'Error', printf = (...args) => console.warn(...args) } = opts;
    return this.print({ ...opts, prefix: prfx, printf });
  }
}

export { destroyCircular };
