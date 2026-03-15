'use client';

import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';
import { formatCurrency, getMonthName } from '../utils/formatters';
import type { MonthlyChartData } from '../types/dashboard.types';

interface RevenueGrowthChartProps {
    data: MonthlyChartData[];
}
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number; payload: MonthlyChartData }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border shadow-xl p-3 rounded-xl text-xs">
                <p className="font-bold mb-1 text-foreground">{getMonthName(label as string)}</p>
                <p className="text-primary font-semibold">
                    Doanh thu: {formatCurrency(payload[0].value as number)}
                </p>
            </div>
        );
    }
    return null;
};

export function RevenueGrowthChart({ data }: RevenueGrowthChartProps) {
    // Reverse data to show chronological order if backend returns newest first
    const chartData = [...data].reverse();

    return (
        <div className="w-full h-[300px] sm:h-[350px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border)"
                        opacity={0.5}
                    />
                    <XAxis
                        dataKey="month"
                        tickFormatter={(tick) => getMonthName(tick).split(' ')[1]} // Only show month number
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }} />
                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="var(--primary)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
