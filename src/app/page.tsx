import Image from "next/image";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { Footer } from "@/components/public/footer";
import { Header } from "@/components/public/header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[var(--brand-surface)]">
        <Section className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url(${siteConfig.brand.backgroundImage})`,
              backgroundRepeat: "repeat",
              backgroundSize: "cover",
            }}
          />
          <Container className="relative">
            <Card className="overflow-hidden bg-white">
              <div className="grid gap-0 md:grid-cols-2">
                <div className="flex flex-col justify-center bg-[var(--brand-surface-alt)] p-8 sm:p-12">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                    Premium catalogue experience
                  </p>
                  <h1 className="max-w-lg text-[var(--font-size-display)] font-semibold tracking-tight text-[var(--foreground)]">
                    Discover the right product faster.
                  </h1>
                  <p className="mt-5 max-w-lg text-base leading-7 text-[var(--text-muted)] sm:text-lg">
                    A clean, multilingual product discovery experience built to support catalogue browsing, feature-led product discovery, and straightforward enquiry actions.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button variant="primary" size="lg">Request Quote</Button>
                    <Button variant="outline" size="lg">Browse Catalogue</Button>
                  </div>
                </div>

                <div className="flex items-center justify-center bg-[var(--background)] p-8 sm:p-12">
                  <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-[var(--shadow-sm)]">
                    <Image
                      src={siteConfig.brand.logoColorSvg}
                      alt={`${siteConfig.name} logo`}
                      width={360}
                      height={180}
                      priority
                      className="mx-auto h-auto w-full max-w-[280px]"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Container>
        </Section>

        <Section className="pt-0">
          <Container className="grid gap-6 md:grid-cols-3">
            {[
              { title: "Responsive", text: "Optimized for mobile, tablet, and desktop discovery flows." },
              { title: "Accessible", text: "Clear focus states, readable contrast, and keyboard-friendly interactions." },
              { title: "Multilingual", text: "Designed for English and Arabic public experiences with RTL awareness." },
            ].map((item) => (
              <Card key={item.title}>
                <CardBody className="space-y-3">
                  <span className="inline-flex rounded-full bg-[var(--brand-primary-light)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand-primary)]">
                    {item.title}
                  </span>
                  <p className="text-sm leading-6 text-[var(--text-muted)]">{item.text}</p>
                </CardBody>
              </Card>
            ))}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
