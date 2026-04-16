import User from "../models/User.js";

// Add money to wallet

export const addMoney = async (req, res) => {
  try {
    const { amount, idempotencyKey } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' })
    if (amount > 100000) return res.status(400).json({ message: 'Max ₹1,00,000 per transaction' })

    const amountInPaise = Math.round(amount * 100)
    const user = await User.findById(req.user._id)

    // Idempotency check — duplicate request block karo
    if (idempotencyKey) {
      const existing = user.wallet.transactions.find(t => t.idempotencyKey === idempotencyKey)
      if (existing) {
        return res.json({ message: 'Already processed', balance: user.wallet.balance, transactions: user.wallet.transactions })
      }
    }

    user.wallet.balance += amountInPaise
    user.wallet.transactions.push({
      type: 'credit',
      amount: amountInPaise,
      description: `Added ₹${amount.toLocaleString('en-IN')}`,
      idempotencyKey: idempotencyKey || null
    })

    await user.save()
    res.json({ message: 'Money added successfully', balance: user.wallet.balance, transactions: user.wallet.transactions })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Get wallet
export const getWallet =  async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet')
    res.json(user.wallet)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

