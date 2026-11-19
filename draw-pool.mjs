import { randomInt } from 'node:crypto';

/** Return a randomly ordered, finite pool for one 300-entry event. */
export function createDrawPool(choose = randomInt) {
  const results = [...Array(30).fill('towel'), ...Array(30).fill('freshener'), ...Array(30).fill('foam'), ...Array(210).fill('loss')];
  for (let index = results.length - 1; index > 0; index--) {
    const target = choose(index + 1);
    if (!Number.isInteger(target) || target < 0 || target > index) {
      throw new RangeError('Random selection must be within the requested range');
    }
    [results[index], results[target]] = [results[target], results[index]];
  }
  return results;
}

