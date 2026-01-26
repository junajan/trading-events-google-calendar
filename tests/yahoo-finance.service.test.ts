import YahooFinance from 'yahoo-finance2';
import YahooService from '../app/services/yahoo-finance.service';

describe('YahooFinance service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('getEarningsData returns earnings for given symbol', async () => {
    const mockYahooFinanceResult = {
      earnings: {
        earningsChart: {
          quarterly: [
            { date: '2Q2023', actual: 0.65, estimate: 0.35 },
            { date: '3Q2023', actual: 0.86, estimate: 0.53 },
            { date: '4Q2023', actual: 1, estimate: 0.8 },
            { date: '1Q2024', actual: 0.98, estimate: 0.83 },
          ],
          currentQuarterEstimate: 1.02,
          currentQuarterEstimateDate: '2Q',
          currentQuarterEstimateYear: 2024,
          earningsDate: [new Date('2024-08-01T10:59:00.000Z'), new Date('2024-08-05T12:00:00.000Z')],
          isEarningsDateEstimate: true,
        },
      },
    };

    jest.spyOn(YahooFinance.prototype, 'quoteSummary').mockResolvedValueOnce(mockYahooFinanceResult);

    const earningsData = await YahooService.getEarningsData('AAPL');
    expect(earningsData).toMatchObject({
      estimatedEarningsDate: '2024-08-01',
      estimatedEarningsDateTime: new Date('2024-08-01T10:59:00.000Z'),
      estimatedEarningsDateTimeEnd: new Date('2024-08-05T12:00:00.000Z'),
      estimatedEarningsDateTimeStart: new Date('2024-08-01T10:59:00.000Z'),
      history: [
        { date: '2Q2023', actual: 0.65, estimate: 0.35 },
        { date: '3Q2023', actual: 0.86, estimate: 0.53 },
        { date: '4Q2023', actual: 1, estimate: 0.8 },
        { date: '1Q2024', actual: 0.98, estimate: 0.83 }
      ],
      isDateEstimated: true,
      quarter: '2Q',
      symbol: 'AAPL',
      year: 2024
    });
  });

  test('getDividendData returns dividend data for given symbol', async () => {
    const mockYahooFinanceResult = {
      summaryDetail: {
        maxAge: 1,
        priceHint: 2,
        previousClose: 270.38,
        open: 269.63,
        dayLow: 269.31,
        dayHigh: 272.99,
        regularMarketPreviousClose: 270.38,
        regularMarketOpen: 269.63,
        regularMarketDayLow: 269.31,
        regularMarketDayHigh: 272.99,
        dividendRate: 2.08,
        dividendYield: 0.0076,
        exDividendDate: new Date('2024-05-16T00:00:00.000Z'),
        payoutRatio: 0.21700001,
        fiveYearAvgDividendYield: 0.65,
        beta: 0.953,
        trailingPE: 30.472038,
        forwardPE: 24.366726,
        volume: 4178906,
        regularMarketVolume: 4178906,
        averageVolume: 6904923,
        averageVolume10days: 5575610,
        averageDailyVolume10Day: 5575610,
        bid: 0,
        ask: 274.6,
        bidSize: 1000,
        askSize: 800,
        marketCap: 557398556672,
        fiftyTwoWeekLow: 221.02,
        fiftyTwoWeekHigh: 290.96,
        priceToSalesTrailing12Months: 16.326368,
        fiftyDayAverage: 274.9234,
        twoHundredDayAverage: 261.1719,
        trailingAnnualDividendRate: 2.01,
        trailingAnnualDividendYield: 0.0074339816,
        currency: 'USD',
        fromCurrency: null,
        toCurrency: null,
        lastMarket: null,
        coinMarketCapLink: null,
        algorithm: null,
        tradeable: false
      },
      calendarEvents: {
        maxAge: 1,
          earnings: {
          earningsDate: [new Date('2024-07-23T10:59:00.000Z'), new Date('2024-07-29T12:00:00.000Z')],
          earningsCallDate: [],
          isEarningsDateEstimate: true,
          earningsAverage: 2.42,
          earningsLow: 2.34,
          earningsHigh: 2.49,
          revenueAverage: 8917850000,
          revenueLow: 8772840000,
          revenueHigh: 9127000000
        },
        exDividendDate: new Date('2024-05-16T00:00:00.000Z'),
        dividendDate: new Date('2024-06-03T00:00:00.000'),
      }
    };

    jest.spyOn(YahooFinance.prototype, 'quoteSummary').mockResolvedValueOnce(mockYahooFinanceResult);

    const dividendData = await YahooService.getDividendData('AAPL');
    expect(dividendData).toMatchObject({
      currency: 'USD',
      exDividendDate: new Date('2024-05-16T00:00:00.000Z'),
      isDateEstimated: true,
      paymentDate: new Date('2024-06-02T22:00:00.000Z'),
      rateAnnual: 2.08,
      rateQuarterly: 0.52,
      symbol: 'AAPL',
    });
  });
});
