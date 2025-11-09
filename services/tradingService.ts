
import { PriceDataPoint, MovingAveragePoint } from '../types';

export * from '../types';

const INITIAL_PRICE = 150;
const VOLATILITY = 0.02;

export const generateInitialPriceData = (count: number): PriceDataPoint[] => {
    const data: PriceDataPoint[] = [];
    let price = INITIAL_PRICE;
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        data.push({ time: now - (count - i) * 2000, price: price });
        price += (Math.random() - 0.5) * price * VOLATILITY;
        if (price < 10) price = 10;
    }
    return data;
};

export const updatePriceData = (history: PriceDataPoint[]): PriceDataPoint[] => {
    const lastPoint = history[history.length - 1];
    let newPrice = lastPoint.price + (Math.random() - 0.5) * lastPoint.price * VOLATILITY;
    if (newPrice < 10) newPrice = 10;
    
    const newPoint = {
        time: Date.now(),
        price: newPrice,
    };

    const newHistory = [...history, newPoint];
    if (newHistory.length > 200) {
        return newHistory.slice(newHistory.length - 200);
    }
    return newHistory;
};

export const calculateSMA = (data: PriceDataPoint[], period: number): MovingAveragePoint[] => {
    if (data.length < period) return [];
    
    const sma: MovingAveragePoint[] = [];
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, val) => acc + val.price, 0);
        sma.push({
            time: data[i].time,
            value: sum / period,
        });
    }
    return sma;
};
