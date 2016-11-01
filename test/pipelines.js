import {Promise} from 'es6-promise';
import assert from 'assert';

import {
	noop,
	plusOne,
	plusFive,
	iterator,
} from './utils';

import Stream from '../src/pipelines/stream';
import Pipeline from '../src/pipelines/pipeline';

describe('Pipelines', () => {
	it('creation', () => {
		const pipeline = new Pipeline();

		assert.ok(pipeline instanceof Pipeline, 'pipeline should be instance of Pipeline class');
		assert.ok(pipeline instanceof Stream, 'pipeline should be instance of Stream class');
	});

	it('data flow', () => {
		const head = new Pipeline();

		const body = head.pipe(value => {
			assert.equal(value, 1, 'initial value should not be changed');
			return value + 1;
		});

		const body2 = head.pipe(value => {
			assert.equal(value, 2, 'initial value should not be changed');
			return value + 1;
		});

		const tail = body.pipe(value => {
			assert.equal(value, 2, 'passed value should be changed as supposed');
			return value;
		});

		const tail2 = body2.pipe(value => {
			assert.equal(value, 3, 'value should be equal to passed one');
			return value;
		});

		const promise = tail.sink(1);

		assert.ok(promise instanceof Promise, 'sink should return promise');

		return Promise
			.all([promise, tail2.sink(2)])
			.then(([value1, value2]) => {
				assert.equal(value1, 2, 'value1 should be equal to passed one');
				assert.equal(value2, 3, 'value2 should be equal to passed one');
			});
	});

	it('subsink', () => {
		const pipeline = new Pipeline();

		const head = pipeline.pipe(value => {
			assert.equal(value, 1, 'value should be equal to passed one');
			return value;
		});

		const tail = head.pipe(value => {
			throw 'should not execute this part';
		});

		return head.sink(1);
	});

	it('merge', () => {
		const values = [];

		const main = new Pipeline();
		const secondary = new Pipeline();

		const secondaryTail = secondary
			.pipe(iterator(values, plusFive))
			.pipe(iterator(values, plusFive));

		return main
			.pipe(iterator(values, plusOne))
			.pipe(secondaryTail)
			.pipe(iterator(values, plusOne))
			.sink(1)
			.then(() => {
				assert.deepEqual(values, [2, 7, 12, 13], 'values should be equal to expected ones');
			});
	});

	it('streams interoperability', () => {
		const values = [];

		const stream = new Stream();
		const pipeline = new Pipeline();

		stream
			.pipe(iterator(values, plusFive))
			.pipe(iterator(values, plusFive));

		return pipeline
			.pipe(iterator(values, plusOne))
			.pipe(stream)
			.pipe(iterator(values, plusOne))
			.pipe(iterator(values, plusOne))
			.sink(1)
			.then(() => {
				assert.deepEqual(values, [2, 7, 12, 3, 4], '"values" should be equal to expected ones');
			});
	});
});
