import {
  getDateFromDateTime,
} from '../utils/common.utils.js';
import yahooFinance from 'yahoo-finance2';

async function getEarningsData (symbol) {
  const result = await yahooFinance.quoteSummary(symbol, { modules: ['earnings'] });
  const { earningsChart } = result.earnings;

  const estimatedEarningsDateTimeStart = earningsChart.earningsDate[0];
  return {
    symbol,
    history: earningsChart.quarterly,
    quarter: earningsChart.currentQuarterEstimateDate,
    year: earningsChart.currentQuarterEstimateYear,
    estimatedEarningsDateTimeStart,
    estimatedEarningsDateTimeEnd: earningsChart.earningsDate[1] || earningsChart.earningsDate[0],
    estimatedEarningsDateTime: estimatedEarningsDateTimeStart,
    estimatedEarningsDate: getDateFromDateTime(estimatedEarningsDateTimeStart),
  };
}

export default {
  getEarningsData,
};
