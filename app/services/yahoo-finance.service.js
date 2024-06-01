import {
  getDateFromDateTime,
} from '../utils/common.utils.js';
import yahooFinance from 'yahoo-finance2';

async function getEarningsData (symbol) {
  const result = await yahooFinance.quoteSummary(symbol, { modules: ['earnings'] });
  const { earningsChart } = result.earnings;

  const estimatedEarningsDateTimeStart = earningsChart.earningsDate[0];
  return {
    estimatedEarningsDate: getDateFromDateTime(estimatedEarningsDateTimeStart),
    estimatedEarningsDateTime: estimatedEarningsDateTimeStart,
    estimatedEarningsDateTimeEnd: earningsChart.earningsDate[1] || earningsChart.earningsDate[0],
    estimatedEarningsDateTimeStart,
    history: earningsChart.quarterly,
    isDateEstimated: earningsChart.isEarningsDateEstimate,
    quarter: earningsChart.currentQuarterEstimateDate,
    symbol,
    year: earningsChart.currentQuarterEstimateYear,
  };
}

export default {
  getEarningsData,
};
