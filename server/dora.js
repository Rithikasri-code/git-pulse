/**
 * DORA Metrics & Engineering Velocity Calculation Module
 * Implements Google Cloud DORA metrics benchmarks:
 * - Deployment Frequency
 * - Lead Time for Changes
 * - Change Failure Rate
 * - Mean Time to Recovery (MTTR)
 */

class DoraMetricsEngine {
  /**
   * Calculates DORA metrics based on deployment events and incident logs.
   * @param {Array<{ timestamp: string|number, status: 'success'|'failure', commitTimestamp: string|number }>} deployments
   * @param {Array<{ startTimestamp: string|number, resolvedTimestamp: string|number }>} incidents
   * @param {number} periodDays
   */
  static analyze(deployments = [], incidents = [], periodDays = 30) {
    if (periodDays <= 0) periodDays = 30;

    const totalDeploys = deployments.length;
    const successfulDeploys = deployments.filter((d) => d.status === 'success').length;
    const failedDeploys = deployments.filter((d) => d.status === 'failure').length;

    // 1. Deployment Frequency (deploys per day)
    const deploysPerDay = totalDeploys / periodDays;
    let deploymentTier = 'Low';
    if (deploysPerDay >= 1) deploymentTier = 'Elite'; // Multiple/day or daily
    else if (deploysPerDay >= 0.14) deploymentTier = 'High'; // Once a week to once a month
    else if (deploysPerDay >= 0.03) deploymentTier = 'Medium';

    // 2. Lead Time for Changes (average minutes between commit and deployment)
    const leadTimes = deployments
      .filter((d) => d.commitTimestamp && d.timestamp)
      .map((d) => {
        const deployTime = new Date(d.timestamp).getTime();
        const commitTime = new Date(d.commitTimestamp).getTime();
        return Math.max(0, (deployTime - commitTime) / (1000 * 60)); // minutes
      });

    const avgLeadTimeMinutes = leadTimes.length > 0
      ? Math.round(leadTimes.reduce((acc, v) => acc + v, 0) / leadTimes.length)
      : 0;

    let leadTimeTier = 'Low';
    if (avgLeadTimeMinutes <= 60) leadTimeTier = 'Elite'; // Less than 1 hour
    else if (avgLeadTimeMinutes <= 1440) leadTimeTier = 'High'; // 1 day
    else if (avgLeadTimeMinutes <= 10080) leadTimeTier = 'Medium'; // 1 week

    // 3. Change Failure Rate
    const changeFailureRate = totalDeploys > 0
      ? Math.round((failedDeploys / totalDeploys) * 100)
      : 0;

    let cfrTier = 'Low';
    if (changeFailureRate <= 5) cfrTier = 'Elite';
    else if (changeFailureRate <= 15) cfrTier = 'High';
    else if (changeFailureRate <= 30) cfrTier = 'Medium';

    // 4. Mean Time to Recovery (MTTR in minutes)
    const recoveryTimes = incidents
      .filter((i) => i.startTimestamp && i.resolvedTimestamp)
      .map((i) => {
        const start = new Date(i.startTimestamp).getTime();
        const resolved = new Date(i.resolvedTimestamp).getTime();
        return Math.max(0, (resolved - start) / (1000 * 60)); // minutes
      });

    const avgMttrMinutes = recoveryTimes.length > 0
      ? Math.round(recoveryTimes.reduce((acc, v) => acc + v, 0) / recoveryTimes.length)
      : 0;

    let mttrTier = 'Low';
    if (avgMttrMinutes <= 60) mttrTier = 'Elite'; // Less than 1 hour
    else if (avgMttrMinutes <= 1440) mttrTier = 'High'; // Less than 1 day
    else if (avgMttrMinutes <= 10080) mttrTier = 'Medium';

    return {
      periodDays,
      deployments: {
        total: totalDeploys,
        success: successfulDeploys,
        failure: failedDeploys,
        ratePerDay: Math.round(deploysPerDay * 100) / 100,
        tier: deploymentTier,
      },
      leadTime: {
        averageMinutes: avgLeadTimeMinutes,
        tier: leadTimeTier,
      },
      changeFailureRate: {
        percentage: changeFailureRate,
        tier: cfrTier,
      },
      timeToRestore: {
        averageMinutes: avgMttrMinutes,
        tier: mttrTier,
      },
      overallTier: [deploymentTier, leadTimeTier, cfrTier, mttrTier].filter((t) => t === 'Elite').length >= 3
        ? 'Elite'
        : 'High',
    };
  }
}

module.exports = { DoraMetricsEngine };
