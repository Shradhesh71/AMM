# 🚀 Solana AMM (Automated Market Maker)

A production-ready decentralized exchange (DEX) built on Solana blockchain featuring support for both SPL Token and Token-2022 standards. This AMM implements the battle-tested constant product formula (x×y=k) with configurable fees, comprehensive security features, and a modern Next.js frontend.

[![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/)
[![Anchor](https://img.shields.io/badge/Anchor-663399?style=for-the-badge&logo=rust&logoColor=white)](https://www.anchor-lang.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)

## ✨ Key Features

- 🔄 **Dual Token Standard Support** - Compatible with SPL Token and Token-2022
- 📊 **Constant Product Formula** - Proven x×y=k mathematical model for price discovery
- ⚙️ **Configurable Fees** - Flexible basis points system (0-10000 BP)
- 🛡️ **Slippage Protection** - User-defined minimum output validation
- 🔐 **Security First** - Program Derived Addresses and checked arithmetic
- 🎨 **Modern Frontend** - React-based UI with wallet integration
- 🧪 **Comprehensive Testing** - Full test coverage for all operations

## 🏗️ System Architecture

### Core Components

| Component | Description |
|-----------|-------------|
| **Pool** | Main state account storing token mints, vaults, and configuration |
| **LP Mint** | ERC20-like tokens representing liquidity provider ownership |
| **Token Vaults** | Associated token accounts holding the actual token reserves |

### Program Derived Addresses (PDAs)

```rust
// Pool account derivation
Pool PDA: ["pool", token_a_mint, token_b_mint]

// LP mint derivation  
LP Mint PDA: ["lp_mint", pool_account_key]
```

### Available Instructions

1. 🏁 **Initialize Pool** - Create new token trading pairs
2. 💧 **Add Liquidity** - Deposit tokens and receive LP tokens
3. 💸 **Remove Liquidity** - Burn LP tokens to withdraw underlying assets
4. 🔄 **Swap A→B** - Exchange token A for token B with fee
5. 🔄 **Swap B→A** - Exchange token B for token A with fee

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** v18 or higher
- **Rust** and **Anchor CLI** v0.31.1
- **Solana CLI** v1.18+
- **pnpm** package manager

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/Shradhesh71/AMM.git
cd AMM

# Install dependencies
pnpm install

# Build the Anchor program
pnpm anchor-build

# Generate program types
pnpm anchor build

# Run comprehensive tests
pnpm anchor-test
```

### Local Development Environment

```bash
# Terminal 1: Start Solana test validator
solana-test-validator

# Terminal 2: Deploy program locally
pnpm anchor deploy

# Terminal 3: Start the frontend development server
pnpm dev
```

The frontend will be available at `http://localhost:3000`

## 📊 AMM Mathematics

### Liquidity Provision Formulas

**Initial Liquidity (Bootstrap):**
```
LP_tokens = √(amount_a × amount_b)
```

**Subsequent Liquidity (Proportional):**
```
LP_tokens = min(
  (amount_a × current_lp_supply) / reserve_a,
  (amount_b × current_lp_supply) / reserve_b
)
```

### Trading Formulas

**Constant Product Invariant:**
```
reserve_a × reserve_b = k (constant before and after trade)
```

**Swap Output Calculation:**
```
amount_in_after_fee = amount_in × (10000 - fee_rate) / 10000
amount_out = (reserve_out × amount_in_after_fee) / (reserve_in + amount_in_after_fee)
```

## 🧪 Testing & Quality Assurance

### Test Coverage

- ✅ **Pool Initialization** - Both SPL Token and Token-2022 pools
- ✅ **Liquidity Management** - Add/remove operations with proper LP calculations
- ✅ **Token Swapping** - Bidirectional swaps with fee validation
- ✅ **Security Checks** - PDA validation, slippage protection, arithmetic safety
- ✅ **Edge Cases** - Zero amounts, insufficient liquidity, overflow protection

### Running Tests

```bash
# Run all tests with coverage
pnpm anchor-test

# Run tests with detailed output
cd anchor && anchor test --skip-lint --verbose

# Run specific test suite
cd anchor && anchor test --skip-lint --grep "AMM"
```

## 🚀 Deployment Guide

### Devnet Deployment

```bash
# Set cluster to devnet
anchor config set --provider.cluster devnet

# Ensure you have devnet SOL
solana airdrop 2 --url devnet

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## ⚙️ Configuration Options

### Fee Structure

```rust
pub struct Pool {
    pub fee_rate: u16, // Basis points (100 = 1%, 10000 = 100%)
    // ... other fields
}
```

**Recommended Fee Ranges:**
- **Low-volume pairs**: 300 BP (3%)
- **Stablecoin pairs**: 25-50 BP (0.25%-0.5%)
- **Volatile pairs**: 100-300 BP (1%-3%)

## 🛡️ Security Features

| Feature | Implementation |
|---------|----------------|
| **PDA Security** | All accounts use cryptographically secure Program Derived Addresses |
| **Arithmetic Safety** | Checked operations prevent integer overflow/underflow |
| **Access Control** | Proper authority validation for all sensitive operations |
| **Slippage Protection** | User-defined minimum output amounts prevent MEV attacks |
| **State Validation** | Comprehensive pool state and balance checks |

## 📁 Project Structure

```
anchor-AMM/
├── anchor/                           # Solana program
│   ├── programs/amm/src/
│   │   ├── lib.rs                   # Program entry point
│   │   ├── states.rs                # Pool state definition
│   │   ├── errors.rs                # Custom error types
│   │   └── instructions/            # Instruction handlers
│   │       ├── initialize_pool.rs   # Pool creation logic
│   │       ├── add_liquidity.rs     # Liquidity provision
│   │       ├── remove_liquidity.rs  # Liquidity withdrawal
│   │       ├── swap.rs              # Token swapping logic
│   │       └── helper.rs            # Utility functions
│   └── tests/                       # Comprehensive test suite
├── src/                             # Next.js frontend
│   ├── app/                         # App router (Next.js 14)
│   ├── components/                  # React components
│   │   ├── ui/                      # Reusable UI components
│   │   ├── solana/                  # Solana-specific components
│   │   └── amm/                     # AMM-specific components
│   └── lib/                         # Utility functions
├── public/                          # Static assets
└── package.json                     # Dependencies and scripts
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please ensure all tests pass and follow the existing code style.

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ on Solana**

[Website](https://www.itsmeshradhesh.tech/) • [Twitter](https://x.com/Shradeshjain835/)

</div>
