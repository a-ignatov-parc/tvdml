/* global describe it */

import assert from 'assert';

import {
  noop,
  plusOne,
  plusFive,
  iterator,
} from './utils';

import Stream from '../src/pipelines/stream';
import Pipeline from '../src/pipelines/pipeline';

describe('Streams', () => {
  it('creation', () => {
    const stream = new Stream();

    assert.ok(
      stream instanceof Stream,
      'stream should be instance of Stream class',
    );

    assert.throws(
      () => stream.pipe(),
      TypeError,
      'stream should not allow creating pipes without handlers',
    );

    const fork1 = stream.pipe(noop());

    assert.ok(
      fork1 instanceof Stream,
      'fork should be instance of Stream class',
    );

    assert.notEqual(stream, fork1, 'fork should not be equal to parent stream');

    const fork2 = stream.pipe(noop());

    assert.notEqual(fork1, fork2, 'forks should not be equal');
  });

  it('data flow', () => {
    const head = new Stream();

    const body = head.pipe((value) => {
      assert.equal(value, 1, 'initial value should not be changed');
      return value + 1;
    });

    const body2 = head.pipe((value) => {
      assert.equal(value, 1, 'initial value should not be changed');
      return value;
    });

    body.pipe((value) => {
      assert.equal(value, 2, 'passed value should be changed as supposed');
      return value;
    });

    body2.pipe((value) => {
      assert.equal(value, 1, 'value should be equal to passed one');
      return value;
    });

    const promise = head.sink(1);

    assert.ok(promise instanceof Promise, 'sink should return promise');

    return promise;
  });

  it('subsink', () => {
    const stream = new Stream();

    const head = stream.pipe(() => {
      throw new Error('should not execute this part');
    });

    const tail = head.pipe((value) => {
      assert.equal(value, 1, 'value should be equal to passed one');
      return value;
    });

    return tail.sink(1);
  });

  it('merge', () => {
    const mainValues = [];
    const secondaryValues = [];

    const main = new Stream();
    const secondary = new Stream();

    secondary
      .pipe(iterator(secondaryValues, plusFive))
      .pipe(iterator(secondaryValues, plusFive));

    main
      .pipe(iterator(mainValues, plusOne))
      .pipe(secondary)
      .pipe(iterator(mainValues, plusOne));

    return main
      .sink(1)
      .then(() => {
        assert.deepEqual(
          mainValues,
          [2, 3],
          '"mainValues" should be equal to expected ones',
        );

        assert.deepEqual(
          secondaryValues,
          [7, 12],
          '"secondaryValues" should be equal to expected ones',
        );
      });
  });

  it('extend', () => {
    const obj = {};

    const stream = new Stream();
    const extended = new Stream({ extend: { foo: 'bar', obj } });

    assert.ok(
      !('foo' in stream),
      '"foo" property should not be in common stream',
    );

    assert.equal(
      extended.foo,
      'bar',
      'value of "foo" property should be equal to passed in options',
    );

    const fork1 = stream.pipe(noop());
    const fork2 = extended.pipe(noop());

    assert.ok(
      !('foo' in fork1),
      '"foo" property should not be in fork of the common stream',
    );

    assert.equal(
      fork2.foo,
      extended.foo,
      '"foo" property should be in all extended stream forks',
    );

    assert.equal(
      fork2.obj,
      extended.obj,
      '"obj" property should be in all extended stream forks',
    );

    assert.equal(
      fork2.obj,
      obj,
      '"obj" object should be link to original object',
    );
  });

  it('onSinkStep', () => {
    const values = [];
    const queue = [];

    const stream = new Stream({
      onSinkStep(step, value) {
        values[step] = value;
        queue.push(value);
        return value;
      },
    });

    stream
      .pipe(value => value + 1)
      .pipe(value => value + 1)
      .pipe(noop());

    return stream
      .sink(1)
      .then(() => {
        assert.deepEqual(
          values,
          [1, 2, 3],
          'values should be equal to expected ones',
        );

        assert.deepEqual(
          queue,
          [1, 2, 3],
          'queue should be equal to expected ones',
        );
      });
  });

  it('onSinkStepEnd', () => {
    const values = [];
    const queue = [];

    const stream = new Stream({
      onSinkStepEnd(step, value) {
        values[step] = value;
        queue.push(value);
        return value;
      },
    });

    stream
      .pipe(value => value + 1)
      .pipe(value => value + 1)
      .pipe(noop());

    return stream
      .sink(1)
      .then(() => {
        assert.deepEqual(
          values,
          [2, 3, undefined],
          'values should be equal to expected ones',
        );

        assert.deepEqual(
          queue,
          [undefined, 3, 2],
          'queue should be equal to expected ones',
        );
      });
  });

  it('onSinkComplete', () => {
    let complete = null;
    const values = [];

    const stream = new Stream({
      onSinkStep(step, value) {
        values[step] = value;
        return value;
      },

      onSinkComplete(value) {
        complete = value;
        values.push(4);
        return value * 10;
      },
    });

    stream
      .pipe(value => value + 1)
      .pipe(value => value + 1)
      .pipe(noop());

    return stream
      .sink(1)
      .then((result) => {
        assert.deepEqual(
          values,
          [1, 2, 3, 4],
          'values should be equal to expected ones',
        );

        assert.deepEqual(
          result,
          10,
          'result value should be equal to expected ones',
        );

        assert.deepEqual(
          complete,
          1,
          'complete value should be equal to expected ones',
        );
      });
  });

  it('pipelines interoperability', () => {
    const values = [];

    const stream = new Stream();
    const pipeline = new Pipeline();

    const pipelineTail = pipeline
      .pipe(iterator(values, plusFive))
      .pipe(iterator(values, plusFive));

    const streamTail = stream
      .pipe(iterator(values, plusOne))
      .pipe(pipelineTail);


    streamTail.pipe(iterator(values, plusOne));
    streamTail.pipe(iterator(values, plusOne));

    return stream
      .sink(1)
      .then(() => {
        assert.deepEqual(
          values,
          [2, 7, 12, 13, 13],
          '"values" should be equal to expected ones',
        );
      });
  });
});
