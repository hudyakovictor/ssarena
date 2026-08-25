// ============================================================
// TERMINAL VOICE — The soul of Signal Arena
// Sarcastic veteran-trader voice. Every entity, card, error.
// «Больно, потому что правда.»
// ============================================================

export const ENTITY_LORE = {
  "fake-breakout-phantom": {
    tagline: "Congratulations. You bought the local top.",
    flavor: "Он никогда не появляется случайно. Он появляется ровно в тот момент, когда ты написал друзьям: «Теперь точно полетели.» Через две свечи рынок начинает бесплатный курс по управлению ожиданиями.",
    onKill: "Achievement Unlocked: Exit Liquidity. Ты вошёл именно туда, где умные деньги закрывали свои позиции. Спасибо за ликвидность. Они ценят твою службу.",
  },
  "leverage-goblin": {
    tagline: "What's the worst that could happen?",
    flavor: "Самый успешный продавец кредитного плеча в истории. Никогда не врёт. Он действительно может сделать x100. Правда забывает уточнить, что вероятность увидеть этот x100 примерно такая же, как закрыть Binance и не открыть её снова через пять минут.",
    onKill: "Bro... x5 is basically spot.",
    onDeath: "The Goblin's deal was attractive. The liquidation price wasn't.",
  },
  "fomo-wraith": {
    tagline: "Everyone is getting rich except you.",
    flavor: "Самое страшное существо рынка. Не потому что убивает. А потому что заставляет тебя добровольно нажать Buy именно тогда, когда умные деньги уже ищут кнопку Sell.",
    onKill: "Everyone already bought. You're late. Again.",
    onDeath: "The green candles screamed. You waited. Rare discipline.",
  },
  "rug-pull-phantom": {
    tagline: "Сайт выглядит идеально. Завтрашнего дня нет.",
    flavor: "Whitepaper написан лучше кандидатской. В Twitter все счастливы. Discord полон модераторов. Есть аудит. Есть KYC. Есть партнёрства. Есть AMA. Нет только одной вещи. Завтрашнего дня.",
    onKill: "Liquidity is locked. (The owner has the key.)",
    onDeath: "Contract said 'welcome'. You checked the exit. Smart.",
  },
  "narrative-siren": {
    tagline: "Не обещает прибыль. Обещает революцию.",
    flavor: "Децентрализацию. ИИ. Массовое принятие. Новый интернет. Финансовую свободу. ...и каким-то образом всё это помещается в токен с капитализацией 14 миллионов.",
    onKill: "The story is free. Reality isn't.",
    onDeath: "Narrative detected. Data checked. Divergence found. Position skipped.",
  },
  "whale-syndicate": {
    tagline: "Если ты увидел кита — ты смотришь слишком поздно.",
    flavor: "Если Twitter увидел кита — кит уже продаёт.",
    onKill: "Retail calls it manipulation. We call it Tuesday.",
    onDeath: "Wallet cluster analysis complete. Accumulation narrative: rejected.",
  },
  "headline-titan": {
    tagline: "Рынок жил спокойно. Потом один человек нажал кнопку Post. Минус 18%.",
    flavor: "Внезапный новостной шок. Нельзя игнорировать — но и реагировать импульсивно — фатально.",
    onKill: "Breaking News. We don't know what happened. But everyone is panicking.",
    onDeath: "One sentence. Trillions move. You stayed calm.",
  },
  "hubris-dragon": {
    tagline: "Самый честный босс игры. Появляется только после серии твоих побед.",
    flavor: "Его нельзя победить. Можно только не кормить.",
    onKill: "You're not lucky anymore. Now you're confident. That's much easier to exploit.",
    onDeath: "Win streak: 15. Confidence: high. Position size: unchanged. Discipline > emotion.",
  },
  "honeypot-mimic": {
    tagline: "Купить? Конечно. Продать? Ахахах.",
    flavor: "Подожди. Ты серьёзно думал, что здесь предусмотрена такая функция?",
    onKill: "Buying proves nothing. Selling proves everything.",
    onDeath: "Test transaction simulated. Sell tax: 99%. Entry: cancelled.",
  },
  "token-parasite": {
    tagline: "Он не ворует деньги. Он просто печатает ещё немного токенов.",
    flavor: "Каждый месяц. Очень вежливо. Очень прозрачно. Согласно roadmap.",
    onKill: "Decentralized... except for those wallets.",
    onDeath: "Holder concentration: acceptable. Wallet clustering: not checked. Parasite: feeding slowly.",
  },
  "insider-syndicate": {
    tagline: "Когда они продают — это «Portfolio Rebalancing». Когда продаёшь ты — «Panic Selling».",
    flavor: "Команда с добрыми лицами и скрытыми admin keys. Multisig выглядит внушительно — пока не выясняется, что все подписанты сидят в одном офисе.",
    onKill: "Security isn't how many signatures you have. It's who holds them.",
    onDeath: "Multisig examined. Signers: linked. Timelock: 6 hours. Risk: unacceptable.",
  },
  "liquidity-hydra": {
    tagline: "Ликвидность есть. Пока ты не решил воспользоваться ею.",
    flavor: "Каскадный сбор стоп-ордеров толпы. Сдвинул стоп? Рынок пошёл за ним. Поставил новый? Снесли и его.",
    onKill: "Your stop wasn't hunted. It was harvested.",
    onDeath: "Liquidity sweep recognized. Stop placement: beyond sweep zone. Entry: post-sweep.",
  },
  "loss-aversion-wraith": {
    tagline: "Парализует страхом признания убытка.",
    flavor: "Позиция -5%. «Развернётся.» -8%. «Ну уже поздно.» -15%. Wraith пирует.",
    onKill: "I'm not wrong. The market is.",
    onDeath: "Stop hit -2.1%. Position closed. No hesitation, no second-guessing.",
  },
  "revenge-wraith": {
    tagline: "После убытка. «Верни потерянное. Прямо сейчас.»",
    flavor: "Ты только что получил стоп. Эмоции кипят. Рука тянется открыть новую сделку. Wraith уже здесь — предлагает 'верный сетап'. Без анализа. Без стопа.",
    onKill: "Mission: Recover Losses. Status: Потери успешно увеличены.",
  },
  "meme-mirage": {
    tagline: "Три случайные свечи. Твой мозг: «Это голова и плечи!»",
    flavor: "Apophenia — склонность видеть паттерны в случайных данных. Mirage — не враг, а отражение твоего собственного желания найти meaning в noise.",
    onKill: "Every chart becomes bullish if you draw enough lines.",
    onDeath: "Apparent pattern. Volume: absent. Structure: weak. Pattern: ignored.",
  },
  "unlock-titan": {
    tagline: "Dragons don't announce surprise visits.",
    flavor: "Unlock Titan не появляется неожиданно. Люди просто очень талантливо делают вид, что календаря не существует.",
    onKill: "Future sellers are still sellers.",
    onDeath: "Unlock identified 2 weeks early. Position exited pre-event. Timing: optimal.",
  },
  "indicator-cult": {
    tagline: "RSI. MACD. EMA. VWAP. SuperTrend. Ichimoku.",
    flavor: "В какой-то момент ты перестал анализировать рынок. Теперь ты анализируешь индикаторы, которые анализируют рынок.",
    onKill: "When every indicator disagrees, add another one.",
    onDeath: "Indicator count: 2 (trend + volume). Signal: clear. Execution: simple.",
  },
  "confirmation-cult": {
    tagline: "Ты искал информацию. Нашёл подтверждение. Разница оказалась критичной.",
    flavor: "Сектантская вера в правоту своей позиции. Игрок видит ТОЛЬКО подтверждающую информацию. Опровергающие данные? «Это шум.» «Это FUD.» «Это исключение.»",
    onKill: "Thesis: bullish. Data selected: bullish only. Contradicting data: ignored. Result: predictable.",
    onDeath: "Bias detected. Devil's Advocate activated. Contradicting data examined.",
  },
};

export const CARD_LORE = {
  "trend-check":        { flavor: "The trend is your friend. Until you become exit liquidity." },
  "support-resistance": { flavor: "Everyone sees the same level. That's the problem." },
  "volume-confirm":     { flavor: "Without volume, it's just expensive optimism." },
  "candle-pattern":     { flavor: "Every candle tells a story. Most are horror." },
  "risk-reward":        { flavor: "Nobody ever went broke taking a good R:R. They found other ways." },
  "stop-discipline":    { flavor: "The market doesn't care about your average entry." },
  "dont-chase":         { flavor: "Green candles are cheaper before everyone notices them." },
  "anti-fomo-shield":   { flavor: "Cooldown: 10 seconds. Most people only need five." },
  "wait-retest":        { flavor: "The market always gives a second chance. Ego usually doesn't." },
  "funding-heat":       { flavor: "When funding looks free, somebody is paying." },
  "oi-spike":           { flavor: "Crowded trades make beautiful liquidations." },
  "liquidity-sweep":    { flavor: "Your stop wasn't hunted. It was harvested." },
  "breakout-confirm":   { flavor: "Patience prints more money than FOMO." },
  "vol-compression":    { flavor: "Calm charts usually have bad intentions." },
  "whale-alert":        { flavor: "If the notification reached your phone, the whale already left." },
  "token-unlock":       { flavor: "Dragons don't announce surprise visits." },
  "narrative-rotation": { flavor: "Yesterday AI. Today RWA. Tomorrow... who knows." },
  "devils-advocate":    { flavor: "Kill your own thesis before the market does." },
  "mtf-alignment":      { flavor: "One chart is an opinion. Five are an interrogation." },
  "macro-catalyst":     { flavor: "One sentence. Trillions move." },
  "onchain-divergence": { flavor: "Price lies. Wallets gossip." },
  "reflexivity-trap":   { flavor: "It goes up because it goes up. The most dangerous investment strategy." },
  "contract-verify":    { flavor: "Trust the code. Read the code. Or pay someone who actually can." },
  "admin-scanner":      { flavor: "One function. Infinite regret." },
  "honeypot-test":      { flavor: "Buying proves nothing. Selling proves everything." },
  "pre-trade-checklist":{ flavor: "Amazing how many disasters fit into one unchecked box." },
  "token-distribution": { flavor: "Twenty wallets. One opinion." },
  "vesting-decoder":    { flavor: "Future sellers are still sellers." },
  "multisig-audit":     { flavor: "Security isn't how many signatures you have. It's who holds them." },
  "stablecoin-flow":    { flavor: "Liquidity rarely disappears. It just changes addresses." },
  "exchange-reserve":   { flavor: "Coins don't move themselves." },
  "governance-risk":    { flavor: "Decentralization ends where emergency powers begin." },
  "protocol-revenue":   { flavor: "Revenue pays bills. Narratives pay influencers." },
  "proxy-detector":     { flavor: "Same code. Different logo." },
  "wallet-cluster":     { flavor: "Decentralization is amazing. Especially when half the supply wakes up simultaneously." },
};

export const ERROR_LORE = {
  "fomo-entry":          { flavor: "Ты не покупал актив. Ты покупал чужую эйфорию." },
  "no-stop-loss":        { flavor: "Стопа не было. Зато была вера. Рынок уважает только одну из этих вещей." },
  "ignored-volume":      { flavor: "The volume was trying to save you. You muted it." },
  "overconfidence":      { flavor: "После пяти удачных сделок ты перестал считать себя трейдером. Теперь ты был оракулом." },
  "revenge-trading":     { flavor: "Mission: Recover Losses. Status: Потери успешно увеличены." },
  "late-entry":          { flavor: "The market waited. You didn't." },
  "stop-widening":       { flavor: "Каждый раз когда цена подходила к Stop, ты героически двигал его дальше. Рынок любит настойчивых людей." },
  "no-invalidation":     { flavor: "I'm not wrong. The market is." },
  "overleverage":        { flavor: "Leverage Goblin просил передать, что ему было очень приятно познакомиться." },
  "confirmation-bias":   { flavor: "Ты искал информацию. Нашёл подтверждение. Разница оказалась критичной." },
  "narrative-blindness": { flavor: "Ты инвестировал не в продукт. Не в команду. Не в Revenue. Ты инвестировал в красивую презентацию." },
  "analysis-paralysis":  { flavor: "Пока ты анализировал, сетап появился, отработал и закончился." },
  "sunk-cost-fallacy":   { flavor: "Ты не мог продать. Потому что уже слишком много потерял. Именно поэтому потерял ещё больше." },
  "herd-following":      { flavor: "Если толпа знает ответ — скорее всего вопрос уже изменился." },
  "tokenomics-neglect":  { flavor: "I'll read the Tokenomics later. Позже оказалось что Team владела половиной проекта." },
  "news-overreaction":   { flavor: "Breaking News. Breaking Portfolio." },
  "anchoring":           { flavor: "Цена была 20 долларов. Теперь всего 5. Значит дёшево. Логика." },
};

export default { ENTITY_LORE, CARD_LORE, ERROR_LORE };
