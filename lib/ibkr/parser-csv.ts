export class ActivityStatementRejected extends Error {
  constructor() {
    super('This looks like an IBKR Activity Statement, which lacks per-lot detail. Please upload a Flex Query configured with Trades (Closed Lots) + Cash Transactions.')
    this.name = 'ActivityStatementRejected'
  }
}

export function parseCsv(_csv: string): never {
  throw new ActivityStatementRejected()
}
