import { useNavigate } from 'react-router-dom'
import { OverviewCards } from '@/components/dashboard/OverviewCards'
import { PortfolioBanner } from '@/components/dashboard/PortfolioBanner'
import { NetWorthChart } from '@/components/dashboard/NetWorthChart'
import { SpendingBreakdown } from '@/components/dashboard/SpendingBreakdown'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { FinancialChat } from '@/components/dashboard/FinancialChat'
import { useTransactions } from '@/hooks/useTransactions'
import { useTransactionSummary } from '@/hooks/useTransactionSummary'
import { useNetWorth } from '@/hooks/useNetWorth'
import { usePortfolio } from '@/hooks/usePortfolio'

export function Dashboard() {
  const navigate = useNavigate()

  const { transactions, loading: txLoading } = useTransactions({ limit: 8 })
  const { byCategory, comparison, loading: summaryLoading } = useTransactionSummary()
  const { netWorth, accounts: nwAccounts, trend, loading: nwLoading } = useNetWorth()
  const { totalValue, totalPnlPercent, dayPnl, holdings, loading: pLoading } = usePortfolio()

  const totalNetWorth = netWorth + (!pLoading ? totalValue : 0)
  const trendWithPortfolio = trend.map((p) => ({ ...p, value: p.value + (!pLoading ? totalValue : 0) }))

  const cashInHand = nwAccounts
    .filter((a) => ['depository', 'deposit', 'recurring_depost', 'term_deposit'].includes(a.type.toLowerCase()))
    .reduce((s, a) => s + a.balance, 0)

  const spendingCategories = byCategory.filter((c) => c.category !== 'Income')

  const transactionsContext = transactions.slice(0, 30).map((t) => ({
    name: t.name, amount: t.amount, category: t.category, date: t.date,
  }))

  const monthlySpend = comparison?.thisMonth ?? 0
  const changePercent = comparison?.changePercent ?? 0

  return (
    <div className="flex flex-col gap-5">
      <OverviewCards
        netWorth={totalNetWorth}
        netWorthLoading={nwLoading}
        portfolioValue={totalValue}
        portfolioLoading={pLoading}
        totalPnlPercent={totalPnlPercent}
        dayPnl={dayPnl}
        holdingsCount={holdings.length}
        monthlySpend={monthlySpend}
        spendChangePercent={changePercent}
        spendLoading={summaryLoading}
        cashInHand={cashInHand}
      />

      {!pLoading && holdings.length === 0 && (
        <PortfolioBanner onNavigate={() => navigate('/market')} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <NetWorthChart
          trendData={trendWithPortfolio}
          totalNetWorth={totalNetWorth}
          loading={nwLoading || pLoading}
        />
        <SpendingBreakdown categories={spendingCategories} loading={summaryLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 items-start">
        <RecentTransactions transactions={transactions} loading={txLoading} />
        <FinancialChat transactionsContext={transactionsContext} />
      </div>
    </div>
  )
}
