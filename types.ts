
export enum StockSymbol {
    GEM = 'GEM',
    TITAN = 'TITAN',
    NOVA = 'NOVA',
}

export interface Stock {
    symbol: StockSymbol;
    name: string;
}

export interface PriceDataPoint {
    time: number;
    price: number;
}

export interface MovingAveragePoint {
    time: number;
    value: number;
}

export interface Strategy {
    type: 'SMA_CROSSOVER';
    shortPeriod: number;
    longPeriod: number;
    tradeAmount: number;
}

export interface PortfolioHolding {
    quantity: number;
    averagePrice: number;
}

export type Portfolio = {
    [key in StockSymbol]?: PortfolioHolding;
};

export interface Trade {
    symbol: StockSymbol;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    timestamp: string;
}
