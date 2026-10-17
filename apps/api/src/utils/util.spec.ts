import { isEmpty, isUniMail } from './util';

describe('isUniMail', () => {
  it.each([
    'max.mustermann@uni-hildesheim.de',
    'mustermann@uni-hildesheim.de',
    'Max.Mustermann@Uni-Hildesheim.DE',
  ])('accepts %s', email => {
    expect(isUniMail(email)).toBe(true);
  });

  it.each([
    'max@gmail.com',
    'max@uni-hildesheimXde',
    'max@student.uni-hildesheim.de.evil.com',
    'max+tag@uni-hildesheim.de',
    '@uni-hildesheim.de',
  ])('rejects %s', email => {
    expect(isUniMail(email)).toBe(false);
  });

  it('gives the same result on repeated calls', () => {
    // A global regex flag would make every second call fail via lastIndex
    expect([1, 2, 3].map(() => isUniMail('max@uni-hildesheim.de'))).toEqual([true, true, true]);
  });
});

describe('isEmpty', () => {
  it.each([null, undefined, '', {}])('treats %p as empty', value => {
    expect(isEmpty(value as never)).toBe(true);
  });

  it.each([0, 'a', { a: 1 }])('treats %p as not empty', value => {
    expect(isEmpty(value)).toBe(false);
  });
});
