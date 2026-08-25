// ============================================================
// ORACLE — ATTN/USD Price Peg + $SIG Price Feed
// Fiat-pegged utility currency pricing
// Uses TradingView/CoinGecko API + fallback
// ============================================================

import { ATTN } from "./attn-currency.js";

// ── PRICE FEED ──
class PriceOracle {
  constructor() {
    this.sigUsdPrice = 0.42;        // Default fallback
    this.lastUpdate = null;
    this.source = "fallback";
    this.cache = new Map();
  }

  // Get current $SIG price (mock for dev, API in prod)
  async getSIGPrice() {
    // Try CoinGecko first
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=signal-token&vs_currencies=usd");
      if (res.ok) {
        const data = await res.json();
        if (data["signal-token"]?.usd) {
          this.sigUsdPrice = data["signal-token"].usd;
          this.source = "coingecko";
          this.lastUpdate = Date.now();
          return this.sigUsdPrice;
        }
      }
    } catch { /* CoinGecko недоступен */ }

    // Try DexScreener
    try {
      const res = await fetch("https://api.dexscreener.com/latest/dex/tokens/0x...SIG");
      if (res.ok) {
        const data = await res.json();
        if (data.pairs?.[0]?.priceUsd) {
          this.sigUsdPrice = parseFloat(data.pairs[0].priceUsd);
          this.source = "dexscreener";
          this.lastUpdate = Date.now();
          return this.sigUsdPrice;
        }
      }
    } catch { /* DexScreener недоступен */ }

    // Fallback: last known price
    return this.sigUsdPrice;
  }

  // Calculate ATTN from $SIG conversion rate
  async sigToAttn(sigAmount) {
    const price = await this.getSIGPrice();
    return Math.floor(sigAmount * (price / ATTN.usdPeg));
  }

  // Calculate $SIG needed for ATTN amount
  async attnToSig(attnAmount) {
    const price = await this.getSIGPrice();
    return Math.ceil(attnAmount * (ATTN.usdPeg / price));
  }

  // Get ATTN price in USD
  getAttnUsdPrice() { return ATTN.usdPeg; }
}

export const oracle = new PriceOracle();
