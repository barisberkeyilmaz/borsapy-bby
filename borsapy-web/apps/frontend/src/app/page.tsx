import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Briefcase, Activity, TrendingUp, LayoutGrid, ArrowRight } from "lucide-react";

const features = [
  {
    title: "Hisse Tarama",
    description: "F/K, PD/DD, temettü verimi ve daha fazla kritere göre BIST hisselerini filtreleyin",
    icon: Search,
    href: "/screener",
    color: "text-blue-500",
  },
  {
    title: "Portföy Yönetimi",
    description: "Portföyünüzü oluşturun, kar/zarar takibi yapın ve performansınızı izleyin",
    icon: Briefcase,
    href: "/portfolio",
    color: "text-green-500",
  },
  {
    title: "Teknik Tarama",
    description: "RSI, MACD, Bollinger gibi teknik indikatörlere göre sinyal taraması",
    icon: Activity,
    href: "/scanner",
    color: "text-purple-500",
  },
  {
    title: "Backtest",
    description: "Stratejilerinizi geçmiş veriler üzerinde test edin ve optimize edin",
    icon: TrendingUp,
    href: "/backtest",
    color: "text-orange-500",
  },
  {
    title: "Endeksler",
    description: "BIST endeksleri ve bileşenleri hakkında detaylı bilgi",
    icon: LayoutGrid,
    href: "/indices",
    color: "text-cyan-500",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight">
          BIST Hisse Tarama ve Analiz
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          borsapy kütüphanesi ile güçlendirilmiş kapsamlı hisse tarama,
          portföy yönetimi ve teknik analiz araçları
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button asChild size="lg">
            <Link href="/screener">
              <Search className="mr-2 h-4 w-4" />
              Taramaya Başla
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-8 w-8 ${feature.color}`} />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                  <div className="mt-4 flex items-center text-sm text-primary">
                    Keşfet <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
