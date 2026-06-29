/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StockItemLog } from '../types';
import { Plus, Minus, HelpCircle, RefreshCw } from 'lucide-react';

interface StockSectionProps {
  stockItems: StockItemLog[];
  onChange: (updatedItems: StockItemLog[]) => void;
  onPreFillPrevBalance: () => void;
  hasPrevDay: boolean;
}

export const StockSection: React.FC<StockSectionProps> = ({
  stockItems,
  onChange,
  onPreFillPrevBalance,
  hasPrevDay,
}) => {
  const handleItemChange = (
    index: number,
    field: keyof StockItemLog,
    value: number
  ) => {
    const updated = [...stockItems];
    const item = { ...updated[index] };

    if (field === 'openStock') {
      item.openStock = Math.max(0, value);
    } else if (field === 'refillStock') {
      item.refillStock = Math.max(0, value);
    } else if (field === 'balanceStock') {
      item.balanceStock = Math.max(0, value);
    } else if (field === 'itemPrice') {
      item.itemPrice = Math.max(0, value);
    }

    // Recalculate sales count: (Open + Refill) - Balance
    const totalStock = item.openStock + item.refillStock;
    item.salesCount = Math.max(0, totalStock - item.balanceStock);

    updated[index] = item;
    onChange(updated);
  };

  // Adjust values with buttons for convenient mobile touch interaction (+/- 1)
  const adjustValue = (index: number, field: 'openStock' | 'refillStock' | 'balanceStock', delta: number) => {
    const updated = [...stockItems];
    const item = { ...updated[index] };
    const currentValue = item[field];
    const newValue = Math.max(0, currentValue + delta);
    
    item[field] = newValue;
    const totalStock = item.openStock + item.refillStock;
    item.salesCount = Math.max(0, totalStock - item.balanceStock);
    
    updated[index] = item;
    onChange(updated);
  };

  const totalSalesRevenue = stockItems.reduce(
    (acc, item) => acc + item.salesCount * item.itemPrice,
    0
  );

  const totalSalesCount = stockItems.reduce((acc, item) => acc + item.salesCount, 0);

  return (
    <section 
      className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8"
      aria-labelledby="stock-details-heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-50 pb-4">
        <div>
          <h2 id="stock-details-heading" className="text-xl font-display font-bold text-slate-900">
            Stock List Details
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Record inventory levels. Sales count is automatically calculated: (Open + Refill) - Balance.
          </p>
        </div>
        
        {hasPrevDay && (
          <button
            type="button"
            onClick={onPreFillPrevBalance}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100/30 focus:outline-none"
            aria-label="Pre-fill opening stock with previous day's closing balance"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
            Carry over previous balances
          </button>
        )}
      </div>

      {/* Responsive Table Card Layout for mobile / Standard Table for desktop */}
      <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0 rounded-2xl border border-slate-100">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100">
            <tr>
              <th className="py-3 px-2 w-12 text-center">S.No</th>
              <th className="py-3 px-3">Item</th>
              <th className="py-3 px-3 text-center">Open Stock</th>
              <th className="py-3 px-3 text-center">Refill Stock</th>
              <th className="py-3 px-3 text-center">Balance Stock</th>
              <th className="py-3 px-3 text-center w-28 bg-slate-50/50">Sales Count</th>
              <th className="py-3 px-3 text-right">Price</th>
              <th className="py-3 px-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {stockItems.map((item, index) => {
              const totalStock = item.openStock + item.refillStock;
              const isDiscrepancy = item.balanceStock > totalStock;
              
              return (
                <tr key={item.itemId} className="hover:bg-slate-50/50 transition-colors">
                  {/* S.No */}
                  <td className="py-3 px-2 text-center font-mono text-xs text-slate-400">
                    {index + 1}.
                  </td>
                  
                  {/* Item Name */}
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {item.itemName}
                  </td>
                  
                  {/* Open Stock */}
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustValue(index, 'openStock', -1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 rounded transition-colors focus:outline-none"
                        aria-label={`Decrease open stock for ${item.itemName}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.openStock || ''}
                        onChange={(e) => handleItemChange(index, 'openStock', parseInt(e.target.value) || 0)}
                        className="w-14 text-center p-1.5 font-mono text-sm border border-slate-200 rounded focus:border-indigo-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        aria-label={`Open stock for ${item.itemName}`}
                      />
                      <button
                        type="button"
                        onClick={() => adjustValue(index, 'openStock', 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 rounded transition-colors focus:outline-none"
                        aria-label={`Increase open stock for ${item.itemName}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  
                  {/* Refill Stock */}
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustValue(index, 'refillStock', -1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 rounded transition-colors focus:outline-none"
                        aria-label={`Decrease refill stock for ${item.itemName}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.refillStock || ''}
                        onChange={(e) => handleItemChange(index, 'refillStock', parseInt(e.target.value) || 0)}
                        className="w-14 text-center p-1.5 font-mono text-sm border border-slate-200 rounded focus:border-indigo-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        aria-label={`Refill stock for ${item.itemName}`}
                      />
                      <button
                        type="button"
                        onClick={() => adjustValue(index, 'refillStock', 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 rounded transition-colors focus:outline-none"
                        aria-label={`Increase refill stock for ${item.itemName}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  
                  {/* Balance Stock */}
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustValue(index, 'balanceStock', -1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 rounded transition-colors focus:outline-none"
                        aria-label={`Decrease balance stock for ${item.itemName}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.balanceStock || ''}
                        onChange={(e) => handleItemChange(index, 'balanceStock', parseInt(e.target.value) || 0)}
                        className={`w-14 text-center p-1.5 font-mono text-sm border rounded focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          isDiscrepancy 
                            ? 'border-rose-300 bg-rose-50 text-rose-700 font-semibold focus:border-rose-500' 
                            : 'border-slate-200 focus:border-indigo-500'
                        }`}
                        aria-label={`Balance stock for ${item.itemName}`}
                      />
                      <button
                        type="button"
                        onClick={() => adjustValue(index, 'balanceStock', 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 rounded transition-colors focus:outline-none"
                        aria-label={`Increase balance stock for ${item.itemName}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {isDiscrepancy && (
                      <span className="block text-[10px] text-center text-rose-500 font-medium mt-0.5">
                        Exceeds total stock ({totalStock})
                      </span>
                    )}
                  </td>
                  
                  {/* Sales Count */}
                  <td className="py-2 px-3 bg-slate-50 text-center font-semibold font-mono text-slate-700">
                    {item.salesCount}
                  </td>
                  
                  {/* Item Price */}
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1 font-mono text-slate-600">
                      <span>₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.itemPrice}
                        onChange={(e) => handleItemChange(index, 'itemPrice', parseFloat(e.target.value) || 0)}
                        className="w-14 text-right p-1 font-mono text-xs border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
                        aria-label={`Price of ${item.itemName}`}
                      />
                    </div>
                  </td>
                  
                  {/* Projected Revenue */}
                  <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                    ₹{(item.salesCount * item.itemPrice).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-100 font-bold bg-slate-50 text-slate-800">
              <td colSpan={2} className="py-3 px-3 text-slate-700 text-sm">
                Total Stock Metrics
              </td>
              <td className="py-3 px-3 text-center font-mono text-slate-600">
                {stockItems.reduce((acc, item) => acc + item.openStock, 0)}
              </td>
              <td className="py-3 px-3 text-center font-mono text-slate-600">
                {stockItems.reduce((acc, item) => acc + item.refillStock, 0)}
              </td>
              <td className="py-3 px-3 text-center font-mono text-slate-600">
                {stockItems.reduce((acc, item) => acc + item.balanceStock, 0)}
              </td>
              <td className="py-3 px-3 text-center bg-slate-100/60 text-slate-800 font-mono">
                {totalSalesCount}
              </td>
              <td className="py-3 px-3"></td>
              <td className="py-3 px-3 text-right text-blue-600 font-mono text-base font-bold">
                ₹{totalSalesRevenue.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
