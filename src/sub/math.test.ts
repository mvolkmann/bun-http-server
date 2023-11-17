import {expect, test} from 'bun:test';
import {add} from './math';

test('add', () => {
  expect(add(2, 2)).toBe(4);
});
