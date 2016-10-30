import {Promise} from 'es6-promise';
import assert from 'assert';

import Pipeline from '../src/pipeline/simple';

describe('Pipeline Streams', () => {
	describe('core', () => {
		it('creating pipelines', () => {
			const pipeline = new Pipeline();

			assert.ok(pipeline instanceof Pipeline, 'pipeline should be instance of Pipeline class');
			assert.throws(() => pipeline.pipe(), TypeError, 'pipeline should not allow creating pipes without handlers');

			const fork1 = pipeline.pipe(none());

			assert.ok(fork1 instanceof Pipeline, 'fork should be instance of Pipeline class');
			assert.notEqual(pipeline, fork1, 'fork should not be equal to parent pipeline');

			const fork2 = pipeline.pipe(none());

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

		it('extends', () => {
			const obj = {};

			const pipeline = new Pipeline();
			const extended = new Pipeline({extend: {foo: 'bar', obj}});

			assert.ok(!('foo' in pipeline), '"foo" property should not be in common pipeline');
			assert.equal(extended.foo, 'bar', 'value of "foo" property should be equal to passed in options');

			const fork1 = pipeline.pipe(none());
			const fork2 = extended.pipe(none());

			assert.ok(!('foo' in fork1), '"foo" property should not be in fork of the common pipeline');
			assert.equal(fork2.foo, extended.foo, '"foo" property should be in all extended pipeline forks');
			assert.equal(fork2.obj, extended.obj, '"obj" property should be in all extended pipeline forks');
			assert.equal(fork2.obj, obj, '"obj" object should be link to original object');
		});
	});
});

function none() {
	return () => {};
}
