const test = require('node:test');
const assert = require('node:assert/strict');
const { DoraMetricsEngine } = require('../server/dora.js');

test('DORA metrics engine calculates correct tiers for high-performing team', () => {
  const deployments = [
    { timestamp: '2026-11-26T10:00:00Z', commitTimestamp: '2026-11-26T09:30:00Z', status: 'success' },
    { timestamp: '2026-11-26T14:00:00Z', commitTimestamp: '2026-11-26T13:40:00Z', status: 'success' },
    { timestamp: '2026-11-26T18:00:00Z', commitTimestamp: '2026-11-26T17:25:00Z', status: 'success' },
  ];

  const incidents = [
    { startTimestamp: '2026-11-26T11:00:00Z', resolvedTimestamp: '2026-11-26T11:20:00Z' },
  ];

  const metrics = DoraMetricsEngine.analyze(deployments, incidents, 3);

  assert.equal(metrics.deployments.total, 3);
  assert.equal(metrics.deployments.tier, 'Elite');
  assert.equal(metrics.leadTime.tier, 'Elite');
  assert.equal(metrics.changeFailureRate.percentage, 0);
  assert.equal(metrics.changeFailureRate.tier, 'Elite');
  assert.equal(metrics.timeToRestore.averageMinutes, 20);
  assert.equal(metrics.timeToRestore.tier, 'Elite');
  assert.equal(metrics.overallTier, 'Elite');
});

test('DORA metrics engine detects high change failure rate', () => {
  const deployments = [
    { timestamp: '2026-11-26T10:00:00Z', commitTimestamp: '2026-11-26T09:00:00Z', status: 'failure' },
    { timestamp: '2026-11-26T14:00:00Z', commitTimestamp: '2026-11-26T13:00:00Z', status: 'success' },
  ];

  const metrics = DoraMetricsEngine.analyze(deployments, [], 10);
  assert.equal(metrics.changeFailureRate.percentage, 50);
  assert.equal(metrics.changeFailureRate.tier, 'Low');
});
