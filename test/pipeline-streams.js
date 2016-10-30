import {Promise} from 'es6-promise';
import assert from 'assert';

import Pipeline from '../src/pipeline/simple';
import PassthroughPipeline from '../src/pipeline/passthrough';

describe('Pipeline Streams', () => {
	it('creating pipelines', () => {
		const pipeline = new Pipeline();

		assert.ok(pipeline instanceof Pipeline, 'pipeline should be instance of Pipeline class');
		assert.throws(() => pipeline.pipe(), TypeError, 'pipeline should not allow creating pipes without handlers');

		const fork1 = pipeline.pipe(noop());

		assert.ok(fork1 instanceof Pipeline, 'fork should be instance of Pipeline class');
		assert.notEqual(pipeline, fork1, 'fork should not be equal to parent pipeline');

		const fork2 = pipeline.pipe(noop());

		assert.notEqual(fork1, fork2, 'forks should not be equal');
	});

	it('pipelines data flow', () => {
		const head = new Pipeline();

		const body = head.pipe(value => {
			assert.equal(value, 1, 'initial value should not be changed');
			return value + 1;
		});

		const body2 = head.pipe(value => {
			assert.equal(value, 1, 'initial value should not be changed');
			return value;
		});

		const tail = body.pipe(value => {
			assert.equal(value, 2, 'passed value should be changed as supposed');
			return value;
		});

		const tail2 = body2.pipe(value => {
			assert.equal(value, 1, 'value should be equal to passed one');
			return value;
		});

		const promise = head.sink(1);

		assert.ok(promise instanceof Promise, 'sink should return promise');

		return promise;
	});

	it('pipelines subsink', () => {
		const pipeline = new Pipeline();

		const head = pipeline.pipe(value => {
			throw 'should not execute this part';
		});

		const tail = head.pipe(value => {
			assert.equal(value, 1, 'value should be equal to passed one');
			return value;
		});

		return tail.sink(1);
	});

	it('extend', () => {
		const obj = {};

		const pipeline = new Pipeline();
		const extended = new Pipeline({extend: {foo: 'bar', obj}});

		assert.ok(!('foo' in pipeline), '"foo" property should not be in common pipeline');
		assert.equal(extended.foo, 'bar', 'value of "foo" property should be equal to passed in options');

		const fork1 = pipeline.pipe(noop());
		const fork2 = extended.pipe(noop());

		assert.ok(!('foo' in fork1), '"foo" property should not be in fork of the common pipeline');
		assert.equal(fork2.foo, extended.foo, '"foo" property should be in all extended pipeline forks');
		assert.equal(fork2.obj, extended.obj, '"obj" property should be in all extended pipeline forks');
		assert.equal(fork2.obj, obj, '"obj" object should be link to original object');
	});

	it('onSinkStep', () => {
		const values = [];

		const pipeline = new Pipeline({
			onSinkStep(step, value) {
				values[step] = value;
				return value;
			}
		});

		pipeline
			.pipe(value => value + 1)
			.pipe(value => value + 1)
			.pipe(noop());

		return pipeline
			.sink(1)
			.then(() => {
				assert.deepEqual(values, [1, 2, 3], 'values should be equal to expected ones');
			});
	});
});

describe('Passthrough Pipelines', () => {
	it('creating passthrough pipelines', () => {
		const pipeline = new PassthroughPipeline();

		assert.ok(pipeline instanceof PassthroughPipeline, 'pipeline should be instance of PassthroughPipeline class');
		assert.ok(pipeline instanceof Pipeline, 'pipeline should be instance of Pipeline class');

		const head = pipeline.pipe(noop());
		const tail = head.pipe(noop());

		assert.equal(head.sink, pipeline.sink, 'head "sink" method should be equal to initial pipeline');
		assert.equal(tail.sink, pipeline.sink, 'tail "sink" method should be equal to initial pipeline');
	});
});

function noop() {
	return () => {};
}
