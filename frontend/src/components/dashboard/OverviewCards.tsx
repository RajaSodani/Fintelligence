import { StatCard } from '@/components/ui/StatCard'
import { formatCompact, formatCurrency } from '@/lib/utils'

interface Props {
  netWorth: number
  netWorthLoading: boolean
  portfolioValue: number
  portfolioLoading: boolean
  totalPnlPercent: number
  dayPnl: number
  holdingsCount: number
  monthlySpend: number
  spendChangePercent: number
  spendLoading: boolean
  cashInHand: number
}

export function OverviewCards({
  netWorth, netWorthLoading,
  portfolioValue, portfolioLoading,
  totalPnlPercent, dayPnl, holdingsCount,
  monthlySpend, spendChangePercent, spendLoading,
  cashInHand,
}: Props) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Net Worth"
        value={(netWorthLoading || portfolioLoading) ? '...' : formatCompact(netWorth)}
        change={netWorth === 0 && !netWorthLoading ? 'Connect a bank' : 'bank + portfolio'}
        changeType={netWorth >= 0 ? 'up' : 'down'}
        sub={(netWorthLoading || portfolioLoading) ? '' : netWorth === 0 ? 'No accounts linked' : `₹${netWorth.toLocaleString('en-IN')}`}
        accent
      />
      <StatCard
        label="Portfolio Value"
        value={portfolioLoading ? '...' : formatCompact(portfolioValue)}
        change={holdingsCount === 0 && !portfolioLoading ? 'Add holdings' : `${totalPnlPercent >= 0 ? '+' : ''}${totalPnlPercent.toFixed(2)}% total return`}
        changeType={totalPnlPercent >= 0 ? 'up' : 'down'}
        sub={portfolioLoading ? '' : holdingsCount === 0 ? 'No holdings yet' : `Day: ${dayPnl >= 0 ? '+' : ''}${formatCurrency(Math.abs(dayPnl))}`}
      />
      <StatCard
        label="Monthly Spend"
        value={spendLoading ? '...' : formatCompact(monthlySpend)}
        change={`${spendChangePercent > 0 ? '+' : ''}${spendChangePercent}% vs last month`}
        changeType={spendChangePercent > 0 ? 'down' : 'up'}
        sub={`Budget: ${formatCompact(30_000)}`}
      />
      <StatCard
        label="Cash in Hand"
        value={netWorthLoading ? '...' : formatCompact(cashInHand)}
        change={cashInHand === 0 && !netWorthLoading ? 'Connect a bank' : 'in bank accounts'}
        changeType="neutral"
        sub={netWorthLoading ? '' : cashInHand === 0 ? 'No accounts linked' : `₹${cashInHand.toLocaleString('en-IN')}`}
      />
    </div>
  )
}
