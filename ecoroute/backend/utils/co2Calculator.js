const EMISSION_FACTORS = {
  car_petrol:    0.192,
  car_diesel:    0.171,
  car_electric:  0.053,
  bus:           0.105,
  train:         0.041,
  subway:        0.041,
  motorcycle:    0.103,
  bicycle:       0,
  walking:       0,
  rideshare:     0.192,
};

function calculateCO2e(transportMode, distanceKm) {
  const factor = EMISSION_FACTORS[transportMode];

  if (factor === undefined) {
    throw new Error(`Unknown transport mode: ${transportMode}`);
  }

  const co2e = distanceKm * factor;
  return Math.round(co2e * 100) / 100;
}

module.exports = { calculateCO2e, EMISSION_FACTORS };