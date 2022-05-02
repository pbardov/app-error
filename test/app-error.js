/* global describe, it */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import assert from 'assert';
import AppError from '../index.js';

chai.use(chaiAsPromised);

describe('AppError functionality test', function appErrorTest() {
  this.timeout(10000);

  let error;
  it('Test error wrap', async () => {
    const err = new Error('Some error');
    error = AppError.wrap(err, { extra1: 'first', extra2: 'second', extra3: 'third' });

    assert.strictEqual(error.message, 'Some error');
    assert.strictEqual(error.extra1, 'first');
    assert.strictEqual(error.extra2, 'second');
    assert.strictEqual(error.extra3, 'third');
  });

  it('Test error.destroyCircular', async () => {
    error.extra = { deep: { error } };
    error.destroyCircular();

    assert.strictEqual(error.extra.deep.error, '[Circular]');
  });

  it('Test JSON.stringify on error with circular structure', async () => {
    error.extra = { deep: { error } };
    const str = JSON.stringify(error);
    assert(str.search('[Circular]') >= 0);
  });

  it('Test error.print', async () => {
    error.print();
  });
});
