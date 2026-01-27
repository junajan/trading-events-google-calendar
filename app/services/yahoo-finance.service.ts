import YahooFinance from 'yahoo-finance2';

import {getDateFromDateTime} from '../utils/common.util';

type QuoteSummaryModule = 'earnings' | 'summaryDetail' | 'calendarEvents';

const YAHOO_FINANCE_EARNINGS_MODULES: QuoteSummaryModule[] = ['earnings'];
const YAHOO_FINANCE_DIVIDEND_MODULES: QuoteSummaryModule[] = ['summaryDetail', 'calendarEvents'];

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

interface EarningsHistory {
  date: string
  actual: number,
  estimate: number,
}

export interface Earnings {
  estimatedEarningsDate: string,
  estimatedEarningsDateTime: Date,
  estimatedEarningsDateTimeEnd: Date,
  estimatedEarningsDateTimeStart: Date,
  history: EarningsHistory[],
  isDateEstimated: boolean,
  quarter: string,
  symbol: string,
  year: number,
}

export interface Dividend {
  currency: string,
  exDividendDate: Date,
  isDateEstimated: boolean,
  paymentDate: Date,
  rateAnnual: number,
  rateQuarterly: number,
  symbol: string,
}

interface YahooEarningsResponse {
  earnings: {
    earningsChart: {
      earningsDate: Date[];
      isEarningsDateEstimate: boolean;
      currentQuarterEstimateDate: string;
      currentQuarterEstimateYear: number;
      quarterly: EarningsHistory[];
    }
  }
}

interface YahooDividendResponse {
  summaryDetail: {
    dividendRate?: number;
    currency: string;
  },
  calendarEvents: {
    exDividendDate?: Date;
    dividendDate?: Date;
  }
}

async function getEarningsData(symbol: string): Promise<Earnings | null> {
  const result = await yahooFinance.quoteSummary(symbol, { modules: YAHOO_FINANCE_EARNINGS_MODULES }) as YahooEarningsResponse;
  const { earningsChart } = result.earnings;

  const estimatedEarningsDateTimeStart = earningsChart.earningsDate[0];
  if (!estimatedEarningsDateTimeStart) {
    return null;
  }

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

async function getDividendData(symbol: string): Promise<Dividend | undefined> {
  const result = await yahooFinance.quoteSummary(symbol, {
    modules: YAHOO_FINANCE_DIVIDEND_MODULES,
  }) as YahooDividendResponse;

  const {
    summaryDetail,
    calendarEvents,
  } = result;

  if (!summaryDetail.dividendRate || !calendarEvents.exDividendDate || !calendarEvents.dividendDate) {
    return;
  }

  return {
    currency: summaryDetail.currency,
    exDividendDate: calendarEvents.exDividendDate,
    isDateEstimated: calendarEvents.exDividendDate < new Date(),
    paymentDate: calendarEvents.dividendDate,
    rateAnnual: summaryDetail.dividendRate,
    rateQuarterly: Math.round(summaryDetail.dividendRate / 4 * 100) / 100,
    symbol,
  };
}

export default {
  getDividendData,
  getEarningsData,
};
