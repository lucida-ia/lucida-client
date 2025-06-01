import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48  to-muted">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_600px] lg:gap-12 xl:grid-cols-[1fr_800px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Crie Provas Profissionais em Segundos com IA
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                O Lucida usa IA avançada para transformar seus materiais de
                estudo em provas prontas para uso. Economize horas de preparação
                e crie avaliações melhores.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <Link href="/signup">
                  Começar Agora <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#features">Saiba Mais</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto flex w-full items-center justify-center">
            <div className="rounded-lg border bg-background p-2 shadow-lg">
              <Image
                src="https://images.pexels.com/photos/4145153/pexels-photo-4145153.jpeg"
                alt="Dashboard do Gerador de Provas com IA"
                width={800}
                height={500}
                className="rounded shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
