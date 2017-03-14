import { getPromise } from './promise';

export const isFunction = fn => typeof fn === 'function';

export const Promisify = fn => {
  const Promise = getPromise();
  return (...args) => new Promise((resolve, reject) => {
    try {
      return Promise.resolve(fn(...args)).then(r => resolve(r), e => reject(e));
    } catch (e) {
      return reject(e);
    }
  });
};
