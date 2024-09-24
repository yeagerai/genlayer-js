type TransactionsConfig = {
  waitInterval: number;
  retries: number;
};

export const transactionsConfig: TransactionsConfig = {
  waitInterval: 3000,
  retries: 10,
};
