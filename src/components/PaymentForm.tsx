import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { isAddress, erc20Abi } from 'viem'
import { arcTestnet } from 'viem/chains'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Send } from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import { toast } from 'sonner'
import { Amount, parseAmount, usdcDecimalsFor } from '@/onchain-money'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'

const CHAIN_ID = arcTestnet.id
const usdcFact = getUsdc(CHAIN_ID)!
const USDC_ADDRESS = usdcFact.address as `0x${string}`

const QUICK_AMOUNTS = ['0.10', '0.25', '1.00', '5.00']

const glass = {
  card: {
    background: 'var(--surface-strong)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid var(--border)',
  } as React.CSSProperties,
  inner: {
    background: 'var(--surface-muted)',
    border: '1px solid var(--border)',
  } as React.CSSProperties,
}

function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || msg.includes('denied')) return 'Transaction cancelled.'
  if (msg.includes('insufficient') || msg.includes('exceeds balance')) return 'Insufficient USDC balance.'
  if (msg.includes('reverted')) return 'Transaction reverted. Check your balance and try again.'
  if (msg.includes('network') || msg.includes('timeout')) return 'Network error. Please retry.'
  return 'Something went wrong. Please try again.'
}

export function PaymentForm() {
  const { isConnected, chainId: walletChainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const isWrongChain = isConnected && walletChainId !== CHAIN_ID
  const recipientValid = isAddress(recipient)
  const amountValid = (() => {
    if (!amount) return false
    try {
      const parsed = parseAmount(CHAIN_ID, amount)
      return parsed.isPositive()
    } catch {
      return false
    }
  })()

  const canSend =
    isConnected &&
    !isWrongChain &&
    recipientValid &&
    amountValid &&
    !isPending &&
    !isConfirming

  const handleSend = useCallback(() => {
    if (!canSend) return
    try {
      const parsed = parseAmount(CHAIN_ID, amount)
      writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipient, parsed.raw],
        chainId: CHAIN_ID,
      })
    } catch (e) {
      toast.error(parseOnchainError(e))
    }
  }, [canSend, amount, recipient, writeContract])

  const txUrl = txHash ? buildTxExplorerUrl(CHAIN_ID, txHash) : null

  const handleReset = () => {
    reset()
    setAmount('')
    setMemo('')
  }

  // Success state
  if (isSuccess && txUrl) {
    return (
      <motion.section
        className="rounded-3xl p-5 shadow-sm"
        style={glass.card}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="size-10" style={{ color: 'var(--success)' }} />
          <div>
            <p className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>
              Payment sent!
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              {Amount.fromRaw(
                parseAmount(CHAIN_ID, amount).raw,
                usdcDecimalsFor(CHAIN_ID),
              ).toFixed(2)}{' '}
              USDC delivered to{' '}
              <span className="mono">
                {recipient.slice(0, 6)}…{recipient.slice(-4)}
              </span>
              {memo ? ` · ${memo}` : ''}
            </p>
          </div>
          <a
            href={txUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
          >
            View on ArcScan <ExternalLink className="size-3" />
          </a>
          <button
            onClick={handleReset}
            className="text-xs font-medium underline-offset-2 hover:underline"
            style={{ color: 'var(--subtle)' }}
          >
            Send another payment
          </button>
        </div>
      </motion.section>
    )
  }

  return (
    <section className="rounded-3xl p-5 shadow-sm" style={glass.card}>
      <h2
        className="display mb-5 text-base font-semibold"
        style={{ color: 'var(--ink)' }}
      >
        Send USDC
      </h2>

      {/* Amount input */}
      <div className="mb-3 rounded-2xl p-4" style={glass.inner}>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, '')
            if (v === '' || /^\d*\.?\d{0,6}$/.test(v)) setAmount(v)
          }}
          placeholder="0.00"
          className="display w-full bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:opacity-20"
          style={{ color: 'var(--ink)' }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>
            USDC · Arc Testnet
          </span>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="mb-3 flex gap-2">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            onClick={() => setAmount(q)}
            className="flex-1 rounded-xl py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              background: amount === q ? 'var(--accent)' : 'var(--surface-muted)',
              color: amount === q ? '#fff' : 'var(--ink-2)',
              border: '1px solid var(--border)',
            }}
          >
            ${q}
          </button>
        ))}
      </div>

      {/* Recipient */}
      <div className="mb-3 rounded-2xl p-3" style={glass.inner}>
        <label
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--muted)', letterSpacing: '0.07em' }}
        >
          Recipient address
        </label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          placeholder="0x…"
          spellCheck={false}
          className="mono w-full bg-transparent text-sm outline-none placeholder:opacity-30"
          style={{
            color: recipient && !recipientValid ? 'var(--danger)' : 'var(--ink)',
          }}
        />
        {recipient && !recipientValid && (
          <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
            Enter a valid 0x address
          </p>
        )}
      </div>

      {/* Memo */}
      <div className="mb-5 rounded-2xl p-3" style={glass.inner}>
        <label
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--muted)', letterSpacing: '0.07em' }}
        >
          Memo (optional)
        </label>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value.slice(0, 64))}
          placeholder="Coffee, rent, thanks…"
          className="w-full bg-transparent text-sm outline-none placeholder:opacity-30"
          style={{ color: 'var(--ink)' }}
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {writeError && (
          <motion.div
            className="mb-3 flex items-start gap-2 rounded-2xl p-3"
            style={{ background: 'rgba(186,43,76,0.07)', border: '1px solid rgba(186,43,76,0.18)' }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" style={{ color: 'var(--danger)' }} />
            <p className="text-xs" style={{ color: 'var(--danger)' }}>
              {parseOnchainError(writeError)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      {!isConnected ? (
        <ConnectKitButton.Custom>
          {({ show }) => (
            <button
              onClick={show}
              className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'var(--accent)' }}
            >
              Connect Wallet
            </button>
          )}
        </ConnectKitButton.Custom>
      ) : isWrongChain ? (
        <button
          onClick={() => switchChain({ chainId: CHAIN_ID })}
          disabled={isSwitching}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          style={{ background: 'var(--danger)' }}
        >
          {isSwitching ? 'Switching…' : 'Switch to Arc Testnet'}
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Confirm in wallet…
            </>
          ) : isConfirming ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Confirming…
            </>
          ) : (
            <>
              <Send className="size-4" />
              Send{amount && amountValid ? ` $${parseFloat(amount).toFixed(2)}` : ' USDC'}
            </>
          )}
        </button>
      )}
    </section>
  )
}
