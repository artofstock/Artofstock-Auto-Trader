
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { generateInitialPriceData, updatePriceData, calculateSMA, Strategy, Trade, Stock, Portfolio, PriceDataPoint } from './services/tradingService';
import { getMarketInsight } from './services/geminiService';
import { StockSymbol } from './types';

const MOCK_STOCKS: Stock[] = [
    { symbol: StockSymbol.GEM, name: 'Gemini Technologies' },
    { symbol: StockSymbol.TITAN, name: 'Titan Industries' },
    { symbol: StockSymbol.NOVA, name: 'Nova Financial' },
];

const INITIAL_BALANCE = 100000;
const SIMULATION_INTERVAL = 2000; // 2 seconds

const App: React.FC = () => {
    const [selectedStock, setSelectedStock] = useState<Stock>(MOCK_STOCKS[0]);
    const [strategy, setStrategy] = useState<Strategy>({
        type: 'SMA_CROSSOVER',
        shortPeriod: 10,
        longPeriod: 30,
        tradeAmount: 1000,
    });
    const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
    const [portfolio, setPortfolio] = useState<Portfolio>({});
    const [trades, setTrades] = useState<Trade[]>([]);
    const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [aiInsight, setAiInsight] = useState<string>('');
    const [isInsightLoading, setIsInsightLoading] = useState<boolean>(false);

    const tradesRef = useRef(trades);
    const portfolioRef = useRef(portfolio);
    const balanceRef = useRef(balance);

    useEffect(() => {
        tradesRef.current = trades;
        portfolioRef.current = portfolio;
        balanceRef.current = balance;
    }, [trades, portfolio, balance]);

    const resetStateForNewStock = useCallback((stock: Stock) => {
        setIsRunning(false);
        setPriceHistory(generateInitialPriceData(150));
        setPortfolio({});
        setTrades([]);
        setBalance(INITIAL_BALANCE);
        setAiInsight('');
    }, []);

    useEffect(() => {
        resetStateForNewStock(selectedStock);
    }, [selectedStock, resetStateForNewStock]);

    useEffect(() => {
        if (!isRunning) return;

        const simulation = setInterval(() => {
            setPriceHistory(prevHistory => {
                const newHistory = updatePriceData(prevHistory);
                const currentPrice = newHistory[newHistory.length - 1].price;
                const shortSMA = calculateSMA(newHistory, strategy.shortPeriod);
                const longSMA = calculateSMA(newHistory, strategy.longPeriod);
                
                const lastShortSMA = shortSMA.length > 1 ? shortSMA[shortSMA.length - 2].value : 0;
                const currentShortSMA = shortSMA.length > 0 ? shortSMA[shortSMA.length - 1].value : 0;
                const lastLongSMA = longSMA.length > 1 ? longSMA[longSMA.length - 2].value : 0;
                const currentLongSMA = longSMA.length > 0 ? longSMA[longSMA.length - 1].value : 0;

                const currentPortfolio = portfolioRef.current;
                const stockHolding = currentPortfolio[selectedStock.symbol] || { quantity: 0, averagePrice: 0 };
                const currentBalance = balanceRef.current;

                // Golden Cross (Buy Signal)
                if (lastShortSMA <= lastLongSMA && currentShortSMA > currentLongSMA) {
                    const quantityToBuy = Math.floor(strategy.tradeAmount / currentPrice);
                    if (currentBalance >= strategy.tradeAmount && quantityToBuy > 0) {
                        const cost = quantityToBuy * currentPrice;
                        setBalance(prev => prev - cost);

                        const newTrade: Trade = {
                            symbol: selectedStock.symbol,
                            type: 'BUY',
                            quantity: quantityToBuy,
                            price: currentPrice,
                            timestamp: new Date().toISOString(),
                        };
                        setTrades(prev => [...prev, newTrade]);

                        setPortfolio(prev => {
                            const existing = prev[selectedStock.symbol] || { quantity: 0, averagePrice: 0 };
                            const totalQuantity = existing.quantity + quantityToBuy;
                            const totalCost = (existing.quantity * existing.averagePrice) + cost;
                            return {
                                ...prev,
                                [selectedStock.symbol]: {
                                    quantity: totalQuantity,
                                    averagePrice: totalCost / totalQuantity,
                                },
                            };
                        });
                    }
                }
                // Death Cross (Sell Signal)
                else if (lastShortSMA >= lastLongSMA && currentShortSMA < currentLongSMA) {
                    if (stockHolding.quantity > 0) {
                        const quantityToSell = stockHolding.quantity; // Sell all
                        const revenue = quantityToSell * currentPrice;
                        setBalance(prev => prev + revenue);

                        const newTrade: Trade = {
                            symbol: selectedStock.symbol,
                            type: 'SELL',
                            quantity: quantityToSell,
                            price: currentPrice,
                            timestamp: new Date().toISOString(),
                        };
                        setTrades(prev => [...prev, newTrade]);

                        setPortfolio(prev => {
                            const newPortfolio = { ...prev };
                            delete newPortfolio[selectedStock.symbol];
                            return newPortfolio;
                        });
                    }
                }
                
                return newHistory;
            });
        }, SIMULATION_INTERVAL);

        return () => clearInterval(simulation);
    }, [isRunning, strategy, selectedStock]);

    const handleStockChange = (symbol: StockSymbol) => {
        const stock = MOCK_STOCKS.find(s => s.symbol === symbol);
        if (stock) {
            setSelectedStock(stock);
        }
    };

    const handleStrategyChange = (newStrategy: Partial<Strategy>) => {
        setStrategy(prev => ({ ...prev, ...newStrategy }));
    };

    const handleToggleBot = () => {
        setIsRunning(prev => !prev);
    };

    const handleFetchInsight = useCallback(async () => {
        setIsInsightLoading(true);
        setAiInsight('');
        try {
            const insight = await getMarketInsight(selectedStock);
            setAiInsight(insight);
        } catch (error) {
            console.error("Failed to fetch AI insight:", error);
            setAiInsight("Error fetching analysis. Please check your API key and try again.");
        } finally {
            setIsInsightLoading(false);
        }
    }, [selectedStock]);

    return (
        <Dashboard
            stocks={MOCK_STOCKS}
            selectedStock={selectedStock}
            onStockChange={handleStockChange}
            strategy={strategy}
            onStrategyChange={handleStrategyChange}
            priceHistory={priceHistory}
            portfolio={portfolio}
            trades={trades}
            balance={balance}
            isRunning={isRunning}
            onToggleBot={handleToggleBot}
            aiInsight={aiInsight}
            isInsightLoading={isInsightLoading}
            onFetchInsight={handleFetchInsight}
        />
    );
};

export default App;
