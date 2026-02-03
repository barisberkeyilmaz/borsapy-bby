/**
 * Technical analysis term explanations in Turkish.
 * Used for tooltips and educational content throughout the app.
 */

export interface Explanation {
  short: string;
  long: string;
}

export const INDICATOR_EXPLANATIONS: Record<string, Explanation> = {
  // Momentum Indicators
  rsi: {
    short: "Asiri alim/satim gostergesi",
    long: "RSI (Goreceli Guc Endeksi) 0-100 arasi deger alir. 30 alti asiri satim bolgesi (alim firsati olabilir), 70 ustu asiri alim bolgesi (satis firsati olabilir).",
  },
  stochastic: {
    short: "Momentum gostergesi",
    long: "Stochastic Osilatoru fiyatin belirli bir donem icindeki araliktaki konumunu olcer. 20 alti asiri satim, 80 ustu asiri alim bolgesidir.",
  },

  // Trend Indicators
  macd: {
    short: "Trend takip gostergesi",
    long: "MACD (Hareketli Ortalama Yakinlasma Ayrisma) iki hareketli ortalamanin farkini gosterir. Sinyal cizgisinin ustune cikmasi alim, altina inmesi satim sinyali olabilir.",
  },
  sma: {
    short: "Basit hareketli ortalama",
    long: "SMA (Basit Hareketli Ortalama) belirli donemdeki kapanis fiyatlarinin ortalamasidir. Trend yonunu belirlemek icin kullanilir.",
  },
  sma_20: {
    short: "20 gunluk ortalama",
    long: "Son 20 gunun kapanis fiyatlarinin ortalamasi. Kisa vadeli trendi gosterir. Fiyat bu ortalamanin ustundeyse yukselis trendi olabilir.",
  },
  sma_50: {
    short: "50 gunluk ortalama",
    long: "Son 50 gunun kapanis fiyatlarinin ortalamasi. Orta vadeli trendi gosterir. Golden Cross (SMA50 > SMA200) ve Death Cross icin onemlidir.",
  },
  sma_200: {
    short: "200 gunluk ortalama",
    long: "Son 200 gunun kapanis fiyatlarinin ortalamasi. Uzun vadeli trendi gosterir. Fiyat bu ortalamanin ustundeyse uzun vadeli yukselis trendinde sayilir.",
  },
  ema: {
    short: "Ustel hareketli ortalama",
    long: "EMA (Ustel Hareketli Ortalama) yakin tarihteki fiyatlara daha fazla agirlik veren hareketli ortalamadir. Fiyat degisikliklerine daha hizli tepki verir.",
  },

  // Volatility Indicators
  bollinger: {
    short: "Volatilite gostergesi",
    long: "Bollinger Bantlari fiyatin volatilitesini olcer. Ust banda yaklasma asiri alim, alt banda yaklasma asiri satim sinyali olabilir.",
  },
  atr: {
    short: "Ortalama gercek aralik",
    long: "ATR (Average True Range) piyasanin volatilitesini olcer. Yuksek ATR yuksek volatilite, dusuk ATR dusuk volatilite anlamina gelir. Stop-loss seviyesi belirlemede kullanilir.",
  },
};

export const CHART_EXPLANATIONS: Record<string, Explanation> = {
  // Timeframes
  period_1d: {
    short: "1 Gun",
    long: "Son 1 gunluk fiyat hareketlerini gosterir. Gun ici islemciler icin uygundur.",
  },
  period_5d: {
    short: "1 Hafta",
    long: "Son 5 is gununun fiyat hareketlerini gosterir. Kisa vadeli trend analizi icin uygundur.",
  },
  period_1mo: {
    short: "1 Ay",
    long: "Son 1 aylik fiyat hareketlerini gosterir. Kisa-orta vadeli trend analizi icin uygundur.",
  },
  period_3mo: {
    short: "3 Ay",
    long: "Son 3 aylik fiyat hareketlerini gosterir. Orta vadeli trend analizi icin uygundur.",
  },
  period_6mo: {
    short: "6 Ay",
    long: "Son 6 aylik fiyat hareketlerini gosterir. Orta-uzun vadeli trend analizi icin uygundur.",
  },
  period_1y: {
    short: "1 Yil",
    long: "Son 1 yillik fiyat hareketlerini gosterir. Uzun vadeli trend analizi ve mevsimsel paternler icin uygundur.",
  },
  period_5y: {
    short: "5 Yil",
    long: "Son 5 yillik fiyat hareketlerini gosterir. Cok uzun vadeli trend ve buyuk resim analizi icin uygundur.",
  },

  // Intervals
  interval: {
    short: "Zaman dilimi",
    long: "Her bir mum/cubuk kaç surelik fiyat hareketini temsil eder. Daha kisa araliklar daha detayli analiz saglar.",
  },

  // Chart Types
  candlestick: {
    short: "Mum grafik",
    long: "Acilis, kapanis, en yuksek ve en dusuk fiyati gosterir. Yesil mumlar yukselis (kapanis > acilis), kirmizi mumlar dusus (kapanis < acilis) gosterir.",
  },
  line: {
    short: "Cizgi grafik",
    long: "Sadece kapanis fiyatlarini gosterir. Genel trend takibi icin idealdir, daha az detay ama daha net goruntu saglar.",
  },
  area: {
    short: "Alan grafik",
    long: "Cizgi grafik + dolgu ile genel egilimi gorsellestirir. Fiyat hareketinin buyukluğunu anlamak icin uygundur.",
  },

  // Toggles
  volume: {
    short: "Islem hacmi",
    long: "Islem hacmini gosterir. Yuksek hacim guclu fiyat hareketinin isaretdir. Hacimle desteklenmeyen hareketler guclu olmayabilir.",
  },
  support_resistance: {
    short: "Destek/Direnc seviyeleri",
    long: "Fiyatin zorlandi kritik seviyeler. Destek (yesil) dususu durdurabilir, direnc (kirmizi) yukselisi durdurabilir. Bu seviyelere yaklasma islem firsati olabilir.",
  },
  signals: {
    short: "Al/Sat sinyalleri",
    long: "Teknik gostergelere dayali otomatik alim/satim onerileri. Yesil oklar alim, kirmizi oklar satim sinyali gosterir.",
  },
};

export const TRADING_EXPLANATIONS: Record<string, Explanation> = {
  // Trade Setup Terms
  entry_price: {
    short: "Giris fiyati",
    long: "Pozisyona girmeniz onerilen fiyat seviyesi. Genellikle mevcut piyasa fiyati veya belirli bir destek/direnc seviyesidir.",
  },
  stop_loss: {
    short: "Zarar durdur seviyesi",
    long: "Fiyat bu seviyeye duserse pozisyonu kapatarak zarari sinirlamalisiniz. Risk yonetiminin en onemli parcasidir. Asla stop-loss olmadan islem yapmayin.",
  },
  take_profit: {
    short: "Kar al seviyesi",
    long: "Hedefe ulastiginda kar alarak pozisyonu kapatmaniz onerilir. Birden fazla hedef belirleyerek kademeli kar alma stratejisi uygulanabilir.",
  },
  take_profit_1: {
    short: "Ilk kar hedefi",
    long: "Ilk ve en yakin kar alma seviyesi. Genellikle pozisyonun bir kismini (ornegin %50) burada kapatmak onerilir.",
  },
  take_profit_2: {
    short: "Ikinci kar hedefi",
    long: "Orta vadeli kar alma seviyesi. Pozisyonun bir kismini daha burada kapatabilirsiniz.",
  },
  take_profit_3: {
    short: "Ucuncu kar hedefi",
    long: "En uzak kar hedefi. Kalan pozisyonu burada tamamen kapatabilirsiniz. Trend guclu ise bu seviyeye ulasma olasiligi vardir.",
  },
  risk_reward: {
    short: "Risk/Odul orani",
    long: "Potansiyel kar / potansiyel zarar orani. 1:2 demek 1 birim risk alarak 2 birim kar potansiyeli var demektir. 1:1.5 ve uzeri kabul edilebilir, 1:2 ve uzeri idealdir.",
  },

  // Direction
  long: {
    short: "Alis pozisyonu",
    long: "Fiyatin yukselecegini ongorarak acilan pozisyon. Once alinir, fiyat yukselince satilarak kar edilir.",
  },
  short: {
    short: "Satis pozisyonu",
    long: "Fiyatin dusecegini ongorarak acilan pozisyon. BIST'te aciga satis sinirli oldugu icin bu yonde islem yapmak zordur.",
  },
  neutral: {
    short: "Notr / Bekle",
    long: "Su an icin net bir islem firsati gorulmemektedir. Teknik gostergeler karisik sinyal vermektedir.",
  },

  // Levels
  support: {
    short: "Destek seviyesi",
    long: "Fiyatin dususte zorlandi ve genellikle dondu seviye. Alicilarin yogunlasti bolge. Fiyat bu seviyeye yaklastiginda alim firsati olabilir.",
  },
  resistance: {
    short: "Direnc seviyesi",
    long: "Fiyatin yukseliste zorlandi ve genellikle dondu seviye. Saticilarin yogunlasti bolge. Fiyat bu seviyeyi kirarsa guclu bir yukselis baslayabilir.",
  },
  pivot: {
    short: "Pivot noktasi",
    long: "Onceki donemin yuksek, dusuk ve kapanis fiyatlarindan hesaplanan kritik seviye. Destek ve direnc seviyeleri icin referans noktasidir.",
  },

  // Signal Strength
  signal_strong: {
    short: "Guclu sinyal",
    long: "Birden fazla gostergenin ayni yonde sinyal verdigi durum. Bu sinyallerin gerceklesmesi olasiligi daha yuksektir.",
  },
  signal_medium: {
    short: "Orta guclu sinyal",
    long: "Tek bir gostergenin verdigi sinyal. Diger gostergelerle teyit edilmesi onerilir.",
  },

  // Sentiment
  bullish: {
    short: "Olumlu / Yukselis",
    long: "Teknik gostergeler fiyatin yukselecegi yonunde isaret ediyor. Alim firsati olabilir.",
  },
  bearish: {
    short: "Olumsuz / Dusus",
    long: "Teknik gostergeler fiyatin dusecegi yonunde isaret ediyor. Satis veya bekleme onerilir.",
  },
  sentiment_neutral: {
    short: "Notr",
    long: "Teknik gostergeler karisik sinyal veriyor. Net bir yon belli degil, beklemek mantikli olabilir.",
  },
};

export const RISK_REWARD_LABELS = {
  excellent: { label: "Mukemmel", minRatio: 3.0 },
  good: { label: "Iyi", minRatio: 2.0 },
  acceptable: { label: "Kabul Edilebilir", minRatio: 1.5 },
  low: { label: "Dusuk", minRatio: 0 },
};

export function getRiskRewardExplanation(ratio: number | null): string {
  if (!ratio) return "Risk/odul orani hesaplanamadi.";
  if (ratio >= 3) return `1:${ratio.toFixed(1)} orani mukemmel. Her 1 TL risk icin ${ratio.toFixed(1)} TL potansiyel kazanc var.`;
  if (ratio >= 2) return `1:${ratio.toFixed(1)} orani iyi. Her 1 TL risk icin ${ratio.toFixed(1)} TL potansiyel kazanc var.`;
  if (ratio >= 1.5) return `1:${ratio.toFixed(1)} orani kabul edilebilir. Daha iyi firsatlar beklenebilir.`;
  return `1:${ratio.toFixed(1)} orani dusuk. Bu islem risk/odul acisindan cazip degil.`;
}

export function getExplanation(category: "indicator" | "chart" | "trading", key: string): Explanation | undefined {
  switch (category) {
    case "indicator":
      return INDICATOR_EXPLANATIONS[key];
    case "chart":
      return CHART_EXPLANATIONS[key];
    case "trading":
      return TRADING_EXPLANATIONS[key];
    default:
      return undefined;
  }
}
