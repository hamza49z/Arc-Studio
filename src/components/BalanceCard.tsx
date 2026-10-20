import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { arcTestnet } from 'viem/chains'
import { TokenUSDC } from '@web3icons/react'
import { Wallet } from 'lucide-react'
import { Amount, usdcDecimalsFor } from '@/onchain-money'
import { getUsdc, buildAddressExplorerUrl } from '@/onchain-facts'

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

export function BalanceCard() {
  const { address, isConnected } = useAccount()

  const { data: rawBalance, isLoading } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: !!address },
  })

  const decimals = usdcDecimalsFor(CHAIN_ID)
  const formattedBalance =
    rawBalance !== undefined
      ? Amount.fromRaw(rawBalance, decimals).toFixed(2)
      : '—'

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null

  const explorerUrl = address
    ? buildAddressExplorerUrl(CHAIN_ID, address)
    : null

  return (
    <section className="rounded-3xl p-5 shadow-sm" style={glass.card}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex size-7 items-center justify-center rounded-xl"
            style={{ background: 'rgba(18,45,69,0.07)' }}
          >
            <Wallet className="size-3.5" style={{ color: 'var(--muted)' }} />
          </div>
          <span
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--muted)', letterSpacing: '0.07em' }}
          >
            Your Balance
          </span>
        </div>
        <TokenUSDC variant="branded" size={22} />
      </div>

      {/* Balance */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="display text-4xl font-bold tabular-nums"
          style={{ color: 'var(--ink)' }}
        >
          {!isConnected
            ? '—'
            : isLoading
              ? '…'
              : formattedBalance}
        </span>
        <span className="text-lg font-medium" style={{ color: 'var(--subtle)' }}>
          USDC
        </span>
      </div>

      {/* Sub-line */}
      <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
        {isConnected && shortAddress ? (
          explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:underline mono"
            >
              {shortAddress}
            </a>
          ) : (
            <span className="mono">{shortAddress}</span>
          )
        ) : (
          'Connect wallet to see your balance'
        )}
        {isConnected && (
          <span className="ml-2 font-medium" style={{ color: 'var(--subtle)' }}>
            · Arc Testnet
          </span>
        )}
      </p>
    </section>
  )
}
