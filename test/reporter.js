const { describe, it } = require('mocha');

const tests = [{ section: 'one' }, { section: 'two' }, { section: 'three' }];

tests.forEach(({ section }) => {
  describe(`test number ${section}`, () => {
    this.meta = { section };
    it('should pass', () => Promise.resolve({ test: section }));
  });
});
