const { describe, it } = require('mocha');
const { expect } = require('chai');

describe('dummy test suite', () => {
  describe('dummy test sub suite', () => {
    it('should return -1 when the value is not present', () => {
      expect([1, 2, 3].indexOf(4)).to.deep.equal(-1);
    });
  });
});
