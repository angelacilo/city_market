'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface PricePoint {
  date: string
  [marketName: string]: string | number
}

interface PriceTrendChartProps {
  data: PricePoint[]
  marketNames: string[]
}

const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#ea580c', '#e11d48', '#0891b2']

export function PriceTrendChart({ data, marketNames }: PriceTrendChartProps) {
  return (
    <div className="w-full h-[400px] bg-white p-8 rounded-[3rem] border border-gray-100 shadow-2xl shadow-green-50/50 mt-12 animate-fade-in">
      <h3 className="text-xl font-black text-gray-900 mb-8 uppercase tracking-tight flex items-center gap-3">
        30-Day Price Trend
        <div className="w-12 h-1 bg-green-500 rounded-full" />
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              fontSize={10} 
              fontFamily="inherit" 
              fontWeight="bold" 
              tick={{ fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              fontSize={10} 
              fontFamily="inherit" 
              fontWeight="bold" 
              tick={{ fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₱${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '1.5rem', 
                border: 'none', 
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                fontSize: '12px',
                fontWeight: '700',
                padding: '12px 16px'
              }} 
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              wrapperStyle={{ 
                fontSize: '10px', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                paddingBottom: '20px' 
              }}
            />
            {marketNames.map((name, idx) => (
              <Line 
                key={name}
                type="monotone" 
                dataKey={name} 
                stroke={COLORS[idx % COLORS.length]} 
                strokeWidth={4} 
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                animationDuration={2000}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
