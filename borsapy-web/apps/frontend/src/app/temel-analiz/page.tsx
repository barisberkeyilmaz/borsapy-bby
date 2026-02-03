import { SingleStockSelector } from "@/components/stock/single-stock-selector";

export default function TemelAnalizPage() {
  return (
    <SingleStockSelector
      title="Temel Analiz"
      description="Finansal metrikler ve sektor karsilastirmalariyla degerlemeler"
      targetPath="/temel-analiz"
    />
  );
}
