import NextImage from 'next/image'
import Link from 'next/link'
import { ArrowRight, Shield, TrendingUp, Users, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StatsSection from '@/components/about/StatsSection'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#050a05] transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-700 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-900/20">
                Verified by City Government
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter">
                About <span className="font-serif italic text-green-700 dark:text-green-500">BCMS</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-xl">
                The digital bridge for transparency in agriculture. We connect Butuanon farmers directly to the heartbeat of the city's economy through data-driven insight.
              </p>
              <div className="pt-4">
                <Button className="h-16 px-10 rounded-2xl bg-[#1b6b3e] hover:bg-[#155430] text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-green-900/20 transition-all active:scale-95 group">
                  Explore Market Data
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl shadow-green-900/10 border-8 border-white dark:border-white/5">
                <NextImage 
                  src="/images/about/hero_veggies.png" 
                  alt="Fresh local produce"
                  width={800}
                  height={1000}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-serif italic text-sm text-center">
                    "Empowering the local food system through digital transparency."
                  </p>
                </div>
              </div>
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-700/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-green-700/5 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-24 bg-gray-50/50 dark:bg-white/[0.02] border-y border-gray-100 dark:border-white/5">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-20">
            <div className="space-y-6">
              <div className="w-16 h-1 bg-green-700 rounded-full" />
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">
                Our <span className="font-serif italic">Mission</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                To digitalize the Butuan City market ecosystem, ensuring every farmer has access to fair pricing and every citizen has transparency in their local food supply chain. We strive to eliminate information asymmetry through real-time data.
              </p>
            </div>
            <div className="space-y-6">
              <div className="w-16 h-1 bg-amber-600 rounded-full" />
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">
                Our <span className="font-serif italic">Vision</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                A thriving, tech-enabled agricultural hub where economic growth is inclusive, data is public, and the "Farm-to-Butuanon" connection is stronger than ever before.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars of Trust */}
      <section className="py-32">
        <div className="container mx-auto px-6 max-w-7xl text-center">
          <div className="max-w-3xl mx-auto space-y-6 mb-20">
            <h2 className="text-5xl font-black text-gray-900 dark:text-white leading-tight">
              The Pillars of <span className="font-serif italic text-green-700 dark:text-green-500">Trust</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Our framework is built on three core values that drive every update to the BCMS platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <CheckCircle2 className="w-8 h-8 text-green-700" />,
                title: "Verification",
                desc: "Every vendor listed is verified by the City Government, ensuring origin traceability and standard compliance."
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-amber-600" />,
                title: "Transparency",
                desc: "Real-time price monitoring prevents price gouging and allows for informed purchasing decisions by consumers."
              },
              {
                icon: <Users className="w-8 h-8 text-indigo-600" />,
                title: "Community",
                desc: "A shared platform that fosters direct relationships between the city's urban consumers and rural producers."
              }
            ].map((pillar, i) => (
              <div key={i} className="p-12 rounded-[2.5rem] bg-white dark:bg-[#0a0f0a] border border-gray-100 dark:border-white/5 shadow-xl shadow-gray-200/50 dark:shadow-none text-left space-y-6 hover:translate-y-[-8px] transition-all duration-300">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center">
                  {pillar.icon}
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{pillar.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* United Front Section */}
      <section className="bg-[#1b6b3e] py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/[0.03] skew-x-[-20deg] translate-x-1/2" />
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-12">
              <h2 className="text-5xl font-black text-white leading-[1.1]">
                A United Front for <span className="font-serif italic text-green-200">Butuan's Future</span>
              </h2>
              
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center shrink-0 text-white font-black text-xs">01</div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-white">Department of Agriculture</h4>
                    <p className="text-green-100/70 text-sm leading-relaxed">Providing technical support, farm-gate data, and quality standard oversight for all participating farmers.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center shrink-0 text-white font-black text-xs">02</div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-white">Butuan City Government</h4>
                    <p className="text-green-100/70 text-sm leading-relaxed">Infrastructure management, digital platform governance, and local policy implementation for fair trade.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 text-center">
              <div className="relative inline-block">
                <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-black/30 border-8 border-white/10">
                  <NextImage 
                    src="/images/about/united_front.png" 
                    alt="Market analyst"
                    width={500}
                    height={600}
                    className="w-full h-auto"
                  />
                </div>
                <p className="mt-8 text-green-100 font-serif italic text-lg opacity-80">
                  "Through synergy, we transform data into livelihoods."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StatsSection />
    </main>
  )
}
