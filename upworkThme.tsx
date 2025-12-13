import Link from "next/link"
import { ArrowRight, PlayCircle, Search, Menu, Star, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#f2f7f2] font-sans text-[#001e00]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#d5e0d5] bg-white px-6 py-4 lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-[#14a800]">
              upwork<span className="text-[#001e00]">.clone</span>
            </Link>
            <div className="hidden items-center gap-6 text-sm font-medium text-[#5e6d55] lg:flex">
              <Link href="#" className="hover:text-[#14a800]">Find Talent</Link>
              <Link href="#" className="hover:text-[#14a800]">Find Work</Link>
              <Link href="#" className="hover:text-[#14a800]">Why Upwork</Link>
              <Link href="#" className="hover:text-[#14a800]">Enterprise</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden w-64 lg:block">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  type="search" 
                  placeholder="Search" 
                  className="h-9 rounded-full border-[#d5e0d5] bg-white pl-9 text-sm focus-visible:ring-[#14a800]" 
                />
              </div>
            </div>
            <Button variant="ghost" className="hidden font-medium hover:text-[#14a800] lg:flex">Log In</Button>
            <Button className="rounded-full bg-[#14a800] px-6 font-medium hover:bg-[#14a800]/90">Sign Up</Button>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-20 lg:py-24">
        <div className="max-w-2xl space-y-8 lg:w-1/2">
          <h1 className="text-5xl font-medium tracking-tight text-[#001e00] sm:text-6xl lg:text-7xl">
            How the world&apos;s best <span className="text-[#14a800]">practice interviews</span>.
          </h1>
          <p className="text-xl font-medium text-[#5e6d55] sm:text-2xl">
            Forget the pressure. Get tailored questions, real-time AI feedback, and the confidence to land your dream job.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full bg-[#14a800] px-8 text-base font-medium hover:bg-[#14a800]/90">
              <Link href="/practice-interview/start">
                Get Started
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-[#14a800] text-[#14a800] hover:bg-[#f2f7f2]"
            >
              <Link href="/practice-interview/result">
                View Demo
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative lg:w-1/2">
          <Card className="overflow-hidden rounded-2xl border-none shadow-2xl">
            <div className="bg-[#001e00] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs font-medium opacity-70">AI Interview Coach</span>
              </div>
            </div>
            <CardContent className="space-y-6 bg-white p-8">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#14a800]/10 text-[#14a800]">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#001e00]">Instant Feedback</h3>
                  <p className="text-[#5e6d55]">"Your answer was strong, but you spoke too fast. Try to pause after key points."</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#14a800]/10 text-[#14a800]">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#001e00]">Safe Environment</h3>
                  <p className="text-[#5e6d55]">Practice as many times as you need. No judgment, just improvement.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#14a800]/10 text-[#14a800]">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#001e00]">Expert Questions</h3>
                  <p className="text-[#5e6d55]">Questions generated from your specific CV and Job Description.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </header>

      {/* Trusted By Section */}
      <section className="w-full bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <p className="mb-8 text-center text-sm font-medium text-[#9aaa97]">TRUSTED BY PROFESSIONALS FROM</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale md:gap-16">
            {/* Simple text placeholders for logos to keep it clean */}
            <span className="text-xl font-bold">Microsoft</span>
            <span className="text-xl font-bold">Airbnb</span>
            <span className="text-xl font-bold">Bissell</span>
            <span className="text-xl font-bold">GoDaddy</span>
            <span className="text-xl font-bold">Cotopaxi</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-12">
        <h2 className="mb-16 text-3xl font-medium tracking-tight text-[#001e00] md:text-5xl">
          Why choose our <span className="text-[#14a800]">AI Coach</span>?
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border-none bg-[#f2f7f2] shadow-none transition-colors hover:bg-[#e4ebe4]">
            <CardHeader>
              <CardTitle className="text-2xl font-medium">Proof of quality</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#5e6d55]">
                Check any pro's work samples, client reviews, and identity verification.
              </p>
            </CardContent>
          </Card>
          <Card className="border-none bg-[#14a800] text-white shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-medium">No cost to join</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90">
                Register and browse professionals, explore projects, or even book a consultation.
              </p>
            </CardContent>
          </Card>
          <Card className="border-none bg-[#f2f7f2] shadow-none transition-colors hover:bg-[#e4ebe4]">
            <CardHeader>
              <CardTitle className="text-2xl font-medium">Safe and secure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#5e6d55]">
                Focus on your work knowing we help protect your data and privacy.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#001e00] py-16 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="space-y-4">
              <h4 className="text-lg font-medium">For Clients</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="#" className="hover:text-white">How to Hire</Link></li>
                <li><Link href="#" className="hover:text-white">Talent Marketplace</Link></li>
                <li><Link href="#" className="hover:text-white">Project Catalog</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-medium">For Talent</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="#" className="hover:text-white">How to Find Work</Link></li>
                <li><Link href="#" className="hover:text-white">Direct Contracts</Link></li>
                <li><Link href="#" className="hover:text-white">Find Opportunity</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="#" className="hover:text-white">Help & Support</Link></li>
                <li><Link href="#" className="hover:text-white">Success Stories</Link></li>
                <li><Link href="#" className="hover:text-white">Upwork Reviews</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Company</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="#" className="hover:text-white">About Us</Link></li>
                <li><Link href="#" className="hover:text-white">Leadership</Link></li>
                <li><Link href="#" className="hover:text-white">Investor Relations</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 md:flex-row">
            <p className="text-sm text-gray-400">© 2024 Upwork Clone Inc.</p>
            <div className="flex gap-6">
              <Link href="#" className="text-gray-400 hover:text-white">Terms of Service</Link>
              <Link href="#" className="text-gray-400 hover:text-white">Privacy Policy</Link>
              <Link href="#" className="text-gray-400 hover:text-white">Accessibility</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
