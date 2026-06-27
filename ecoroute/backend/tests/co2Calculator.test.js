const { calculateCO2e, EMISSION_FACTORS } = require('../utils/co2Calculator');

describe('CO2 Calculator', () => {
  it('calculates CO2 correctly for known transport modes', () => {
    expect(calculateCO2e('car_petrol', 10)).toBe(1.92);
    expect(calculateCO2e('bus', 15)).toBe(1.58);
    expect(calculateCO2e('train', 5)).toBe(0.21);
  });

  it('returns zero for zero-emission modes', () => {
    expect(calculateCO2e('bicycle', 10)).toBe(0);
    expect(calculateCO2e('walking', 5)).toBe(0);
  });

  it('throws for unknown transport modes', () => {
    expect(() => calculateCO2e('rocket', 10)).toThrow('Unknown transport mode: rocket');
  });
});
