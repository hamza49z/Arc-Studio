import { ConnectKitButton } from 'connectkit'
import { TokenUSDC, NetworkArc } from '@web3icons/react'
import { BalanceCard } from './components/BalanceCard'
import { PaymentForm } from './components/PaymentForm'
import { TxHistory } from './components/TxHistory'

export default function App() {
  return (
    <div
      className="min-h-dvh"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Topbar */}
      <header className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-xl"
            style={{ background: 'var(--accent)' }}
          >
            <TokenUSDC variant="mono" size={16} />
          </div>
          <span
            className="display text-base font-bold"
            style={{ color: 'var(--ink)' }}
          >
            Arc Pay
          </span>
        </div>
        <ConnectKitButton />
      </header>

      {/* Network pill */}
      <div className="mx-auto mb-4 flex max-w-md justify-center px-4">
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{
            background: 'rgba(18,45,69,0.06)',
            border: '1px solid var(--border)',
          }}
        >
          <NetworkArc variant="branded" size={14} />
          <span className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
            Arc Testnet · USDC gas
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-10">
        <BalanceCard />
        <PaymentForm />
        <TxHistory />

        {/* Faucet reminder */}
        <p className="text-center text-xs" style={{ color: 'var(--subtle)' }}>
          Need testnet USDC?{' '}
          <span
            className="font-medium"
            style={{ color: 'var(--accent-hover)' }}
          >
            Use the "Get test USDC" button in the Arc Studio sidebar.
          </span>
        </p>
      </main>
    </div>
  )
}
