
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Strategy, Stock, PriceDataPoint, Portfolio, Trade, StockSymbol } from '../types';
import { calculateSMA } from '../services/tradingService';
import { PlayIcon, StopIcon, BotIcon, ChartIcon, HistoryIcon, WalletIcon, SparklesIcon } from './icons';

interface DashboardProps {
    stocks: Stock[];
    selectedStock: Stock;
    onStockChange: (symbol: StockSymbol) => void;
    strategy: Strategy;
    onStrategyChange: (newStrategy: Partial<Strategy>) => void;
    priceHistory: PriceDataPoint[];
    portfolio: Portfolio;
    trades: Trade[];
    balance: number;
    isRunning: boolean;
    onToggleBot: () => void;
    aiInsight: string;
    isInsightLoading: boolean;
    onFetchInsight: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const Card: React.FC<{ children: React.ReactNode; className?: string, title: string, icon: React.ReactNode }> = ({ children, className, title, icon }) => (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 md:p-6 ${className}`}>
        <div className="flex items-center mb-4">
            {icon}
            <h3 className="text-lg font-bold text-gray-200 ml-3">{title}</h3>
        </div>
        {children}
    </div>
);

export const Dashboard: React.FC<DashboardProps> = (props) => {
    const { stocks, selectedStock, onStockChange, strategy, onStrategyChange, priceHistory, portfolio, trades, balance, isRunning, onToggleBot, aiInsight, isInsightLoading, onFetchInsight } = props;

    const shortSMA = calculateSMA(priceHistory, strategy.shortPeriod);
    const longSMA = calculateSMA(priceHistory, strategy.longPeriod);

    const chartData = priceHistory.map(p => {
        const short = shortSMA.find(s => s.time === p.time);
        const long = longSMA.find(l => l.time === p.time);
        return {
            time: new Date(p.time).toLocaleTimeString(),
            price: p.price,
            shortSMA: short ? short.value : null,
            longSMA: long ? long.value : null,
        }
    });
    
    const holding = portfolio[selectedStock.symbol];
    const portfolioValue = (holding?.quantity || 0) * (priceHistory[priceHistory.length - 1]?.price || 0);
    const totalValue = balance + portfolioValue;
    const initialValue = 100000;
    const pnl = totalValue - initialValue;
    const pnlPercent = (pnl / initialValue) * 100;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 font-sans p-4 lg:p-6">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-4 md:mb-0">
                    <BotIcon className="w-10 h-10 text-cyan-500" />
                    <h1 className="text-3xl font-bold ml-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">Gemini Auto Trader</h1>
                </div>
                <div className="flex items-center space-x-4 bg-gray-800 p-2 rounded-lg">
                    <span className="font-semibold">Selected Stock:</span>
                    <select
                        value={selectedStock.symbol}
                        onChange={(e) => onStockChange(e.target.value as StockSymbol)}
                        className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        disabled={isRunning}
                    >
                        {stocks.map(s => <option key={s.symbol} value={s.symbol}>{s.name} ({s.symbol})</option>)}
                    </select>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Main Content: Chart and History */}
                <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-6">
                    <Card title="Price Chart & Indicators" icon={<ChartIcon className="w-6 h-6 text-cyan-500" />}>
                        <div className="h-96 -ml-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={(val) => `$${val.toFixed(0)}`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #374151' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={2} dot={false} name={selectedStock.symbol} />
                                    <Line type="monotone" dataKey="shortSMA" stroke="#a78bfa" strokeWidth={1.5} dot={false} name={`SMA(${strategy.shortPeriod})`} />
                                    <Line type="monotone" dataKey="longSMA" stroke="#f472b6" strokeWidth={1.5} dot={false} name={`SMA(${strategy.longPeriod})`} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <Card title="Gemini Market Insight" icon={<SparklesIcon className="w-6 h-6 text-cyan-500" />}>
                            <button onClick={onFetchInsight} disabled={isInsightLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                                {isInsightLoading ? <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"></div> : 'Analyze with AI'}
                            </button>
                            {aiInsight && (
                                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-sm prose prose-invert prose-p:my-1 prose-ul:my-1 max-w-none" dangerouslySetInnerHTML={{ __html: aiInsight.replace(/\n/g, '<br />') }} />
                            )}
                        </Card>
                         <Card title="Trade History" icon={<HistoryIcon className="w-6 h-6 text-cyan-500" />}>
                            <div className="h-48 overflow-y-auto pr-2">
                                <ul className="space-y-2 text-sm">
                                    {trades.slice().reverse().map((trade, i) => (
                                        <li key={i} className={`flex justify-between items-center p-2 rounded-md ${trade.type === 'BUY' ? 'bg-emerald-900/30' : 'bg-rose-900/30'}`}>
                                            <div className="flex items-center">
                                                <span className={`font-bold mr-2 ${trade.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{trade.type}</span>
                                                <span className="text-gray-400">{trade.quantity} @ {formatCurrency(trade.price)}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                                        </li>
                                    ))}
                                </ul>
                                {trades.length === 0 && <p className="text-gray-500 text-center mt-4">No trades yet.</p>}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Sidebar: Controls and Status */}
                <div className="lg:col-span-1 xl:col-span-1 flex flex-col gap-6">
                    <Card title="Control Panel" icon={<BotIcon className="w-6 h-6 text-cyan-500" />}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Short SMA Period</label>
                                <input type="number" value={strategy.shortPeriod} onChange={e => onStrategyChange({ shortPeriod: +e.target.value })} disabled={isRunning} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Long SMA Period</label>
                                <input type="number" value={strategy.longPeriod} onChange={e => onStrategyChange({ longPeriod: +e.target.value })} disabled={isRunning} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Trade Amount (USD)</label>
                                <input type="number" value={strategy.tradeAmount} step="100" onChange={e => onStrategyChange({ tradeAmount: +e.target.value })} disabled={isRunning} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            </div>
                        </div>
                        <button onClick={onToggleBot} className={`mt-6 w-full flex items-center justify-center py-3 px-4 text-lg font-bold rounded-lg transition-all duration-300 ${isRunning ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                            {isRunning ? <StopIcon className="w-6 h-6 mr-2" /> : <PlayIcon className="w-6 h-6 mr-2" />}
                            {isRunning ? 'Stop Bot' : 'Start Bot'}
                        </button>
                         <div className={`mt-2 text-center text-sm font-semibold py-1 rounded-md ${isRunning ? 'text-emerald-400 bg-emerald-900/50' : 'text-rose-400 bg-rose-900/50'}`}>
                           Status: {isRunning ? 'Running' : 'Stopped'}
                        </div>
                    </Card>

                    <Card title="Portfolio & Performance" icon={<WalletIcon className="w-6 h-6 text-cyan-500" />}>
                       <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-gray-400">Total Value</span>
                                <span className="text-2xl font-bold">{formatCurrency(totalValue)}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-gray-400">P/L</span>
                                <span className={`text-lg font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(pnl)} ({pnlPercent.toFixed(2)}%)</span>
                            </div>
                            <hr className="border-gray-700"/>
                            <div className="flex justify-between items-baseline">
                                <span className="text-gray-400">Cash Balance</span>
                                <span>{formatCurrency(balance)}</span>
                            </div>
                             <div className="flex justify-between items-baseline">
                                <span className="text-gray-400">Portfolio Value</span>
                                <span>{formatCurrency(portfolioValue)}</span>
                            </div>
                       </div>
                       <div className="mt-4">
                            <h4 className="font-semibold mb-2">Holdings</h4>
                            {holding && holding.quantity > 0 ? (
                                <div className="text-sm bg-gray-900/50 p-3 rounded-lg">
                                    <div className="flex justify-between"><span>Symbol:</span> <strong>{selectedStock.symbol}</strong></div>
                                    <div className="flex justify-between"><span>Quantity:</span> <strong>{holding.quantity.toFixed(2)}</strong></div>
                                    <div className="flex justify-between"><span>Avg. Price:</span> <strong>{formatCurrency(holding.averagePrice)}</strong></div>
                                </div>
                            ) : <p className="text-gray-500 text-center text-sm">No holdings for {selectedStock.symbol}.</p>}
                       </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};
