'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dummyCryptoAssets } from '@/lib/dummyData';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function CryptoWidget() {
  const [cryptos, setCryptos] = useState(dummyCryptoAssets);

  useEffect(() => {
    // Simulate live price updates
    const interval = setInterval(() => {
      setCryptos((prev) =>
        prev.map((crypto) => {
          const priceChange = (Math.random() - 0.5) * 100;
          const newPrice = crypto.price + priceChange;
          const newChange = ((newPrice - crypto.price) / crypto.price) * 100;
          
          return {
            ...crypto,
            price: newPrice,
            change24h: newChange,
            sparklineData: [...crypto.sparklineData.slice(1), newPrice],
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const renderSparkline = (data: number[]) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Crypto Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cryptos.map((crypto) => (
          <div key={crypto.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{crypto.symbol}</div>
                <div className="text-xs text-muted-foreground">{crypto.name}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${crypto.price.toFixed(2)}</div>
                <div
                  className={`text-xs flex items-center gap-1 justify-end ${
                    crypto.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {crypto.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(crypto.change24h).toFixed(2)}%
                </div>
              </div>
            </div>
            <div className={crypto.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
              {renderSparkline(crypto.sparklineData)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
