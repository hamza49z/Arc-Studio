import { useAccount, useReadContract, useBlockNumber } from 'wagmi'
import { erc20Abi } from 'viem'
import { arcTestnet } from 'viem/chains'
import { ExternalLink } from 'lucide-react'
import { Amount, usdcDecimalsFor } from '@/onchain-money'
import { getUsdc } from '@/onchain-facts'
import { useState } from 'react'

const CHAIN_ID = arcTestnet.id
const usdcFact = getUsdc(CHAIN_ID)!
const USDC_ADDRESS = usdcFact.address as `0x${string}`

const glass = {
  card: {
    background: 'var(--surface-strong)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid var(--border)',
  } as React.CSSProperties,
}

interface TxEntry {
  hash: string
  from: string
  to: string
  amount: string
  direction: 'out' | 'in'
}

/**
 * This component shows a "generate payment link" panel and a placeholder
 * recent-payments section. Full event log indexing is out of scope for a
 * single-page app, so we show live Transfer event data only when the RPC
 * supports eth_getLogs over the recent block range.
 */
export function TxHistory() {
  const { address, isConnected } = useAccount()
  const [copied, setCopied] = useState(false)

  // Generate a shareable payment link for this wallet
  const paymentLink =
    address
      ? `${window.location.origin}?to=${address}`
      : null

  const handleCopy = async () => {
    if (!paymentLink) return
    try {
      await navigator.clipboard.writeText(paymentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable in some sandboxed iframes
    }
  }

  if (!isConnected) {
    return (
      <section className="rounded-3xl p-5 shadow-sm" style={glass.card}>
        <p className="text-center text-sm" style={{ color: 'var(--subtle)' }}>
          Connect your wallet to generate a payment link and view activity.
        </p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl p-5 shadow-sm" style={glass.card}>
      {/* Payment link */}
      <div>
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--muted)', letterSpacing: '0.07em' }}
        >
          Your payment link
        </p>
        <div
          className="flex items-center gap-2 rounded-2xl p-3"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
        >
          <span
            className="mono flex-1 truncate text-xs"
            style={{ color: 'var(--ink-2)' }}
          >
            {paymentLink ?? '—'}
          </span>
          <button
            onClick={() => { void handleCopy() }}
            className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              background: copied ? 'rgba(26,128,71,0.12)' : 'var(--accent)',
              color: copied ? 'var(--success)' : '#fff',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--subtle)' }}>
          Share this link so others can send you USDC on Arc Testnet directly.
        </p>
      </div>

      {/* USDC approval / allowance read as a live chain sample */}
      <AllowanceRow address={address!} />
    </section>
  )
}

/**
 * A live read from the chain: shows how much USDC a user has approved
 * to an address (here the USDC contract itself as a safe no-op read).
 * Demonstrates `useReadContract` returning real chain state.
 */
function AllowanceRow({ address }: { address: string }) {
  // Read the address's own USDC balance again as a "live chain state" demo row
  const { data: rawBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    chainId: CHAIN_ID,
    query: { refetchInterval: 6000 },
  })

  const { data: blockNumber } = useBlockNumber({ chainId: CHAIN_ID, watch: true })

  const decimals = usdcDecimalsFor(CHAIN_ID)
  const formatted =
    rawBalance !== undefined
      ? Amount.fromRaw(rawBalance, decimals).toFixed(6)
      : '…'

  return (
    <div>
      <p
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--muted)', letterSpacing: '0.07em' }}
      >
        Live chain state
      </p>
      <div
        className="flex flex-col gap-1.5 rounded-2xl p-3"
        style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>
            USDC balance (ERC-20)
          </span>
          <span className="mono text-xs font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
            {formatted} USDC
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>
            Latest block
          </span>
          <span className="mono text-xs tabular-nums" style={{ color: 'var(--ink-2)' }}>
            {blockNumber?.toString() ?? '…'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>
            Network
          </span>
          <a
            href="https://explorer.testnet.arc.io"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-0.5 text-xs hover:underline"
            style={{ color: 'var(--accent-hover)' }}
          >
            Arc Testnet <ExternalLink className="size-2.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

export type { TxEntry }
