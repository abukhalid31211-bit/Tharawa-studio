import { createFileRoute } from '@tanstack/react-router'
import { LiveTicker } from '@/components/site/LiveTicker'
import { Hero } from '@/components/home/Hero'
import { TrustBadges } from '@/components/home/TrustBadges'
import { ServicesSection } from '@/components/home/ServicesSection'
import { StatsSection } from '@/components/home/StatsSection'
import { HowItWorks } from '@/components/home/HowItWorks'
import { MarketsPreview } from '@/components/home/MarketsPreview'
import { WhyChooseUs } from '@/components/home/WhyChooseUs'
import { Testimonials } from '@/components/home/Testimonials'
import { LatestNews } from '@/components/home/LatestNews'
import { CtaSection } from '@/components/home/CtaSection'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      <LiveTicker />
      <Hero />
      <TrustBadges />
      <ServicesSection />
      <StatsSection />
      <HowItWorks />
      <MarketsPreview />
      <WhyChooseUs />
      <Testimonials />
      <LatestNews />
      <CtaSection />
    </div>
  )
}

