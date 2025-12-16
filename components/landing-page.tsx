"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Bot,
  Mic,
  ScanText,
  Rocket,
  Brain,
  ShieldCheck,
} from "lucide-react";

function useRevealOnScroll(selector = ".reveal") {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add("show")
        ),
      { threshold: 0.14 }
    );
    const nodes = Array.from(document.querySelectorAll(selector));
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [selector]);
}

function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const element = el;
    function onMove(e: MouseEvent) {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - y) * 10;
      const ry = (x - 0.5) * 12;
      element.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
    function onLeave() {
      element.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
    }
    element.addEventListener("mousemove", onMove);
    element.addEventListener("mouseleave", onLeave);
    return () => {
      element.removeEventListener("mousemove", onMove);
      element.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="group relative rounded-xl border border-border/60 bg-card/80 p-6 shadow-[0_10px_30px_-10px_rgb(0_0_0/.25)] transition-transform will-change-transform"
      style={{ transform: "perspective(900px) rotateX(0) rotateY(0)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-xl opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(400px 200px at var(--mx,50%) var(--my,50%), color(display-p3 0.24 0.75 0.52 / .25), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}

export function LandingPage() {
  useRevealOnScroll();

  useEffect(() => {
    const root = document.documentElement;
    function update(e: MouseEvent) {
      root.style.setProperty("--mx", `${e.clientX}px`);
      root.style.setProperty("--my", `${e.clientY}px`);
    }
    window.addEventListener("mousemove", update);
    return () => window.removeEventListener("mousemove", update);
  }, []);

  // Animation variants
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  } as const;
  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
    },
  } as const;

  return (
    <div className="relative min-h-screen overflow-clip font-sans">
      <motion.div
        aria-hidden
        className="intro-overlay"
        initial={{ clipPath: "circle(0% at 50% 50%)", opacity: 1 }}
        animate={{ clipPath: "circle(140% at 50% 50%)", opacity: 0 }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 gradient-bg" />

      <header className="sticky top-0 z-50 w-full border-b border-[#e4ebe4] dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg supports-backdrop-filter:bg-white/60 dark:supports-backdrop-filter:bg-zinc-950/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between  pe-6 ps-2 lg:pe-8 lg:ps-4">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Karir Flow home"
          >
            <Image
              src="/logo-dashboard-lightmode.svg"
              alt="Karir Flow logo"
              width={200}
              height={200}
              className="block dark:hidden h-14 w-auto"
              priority
            />
            <Image
              src="/logo-dashboard-darkmode.svg"
              alt="Karir Flow logo"
              width={200}
              height={200}
              className="hidden dark:block h-14 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Button
              variant="outline"
              className="hidden sm:inline-flex rounded-lg"
              asChild
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-20 pt-8 md:grid-cols-2 lg:px-8 lg:pb-28 lg:pt-16">
        <motion.div
          className="relative z-10"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.p
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
          >
            <Sparkles className="size-4 text-primary" /> Your AI Career Copilot
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="mt-4 text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl"
          >
            Land your next role faster with intelligent guidance
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 max-w-xl text-pretty text-muted-foreground"
          >
            From CV insights to tailored job recommendations and interview
            practice with real-time feedback—experience a career platform that
            adapts to you.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            <Button className="group" asChild>
              <Link href="/register">
                Get started
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="#features">Explore features</Link>
            </Button>
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="mt-8 flex items-center gap-5 text-xs text-muted-foreground"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Private by default</span>
            <div className="h-2 w-2 rounded-full bg-violet-500" />
            <span>No spam, no fluff</span>
          </motion.div>
        </motion.div>

        <div className="relative reveal">
          <div className="absolute -left-10 -top-10 size-40 rounded-full bg-primary/25 orb" />
          <div className="absolute -bottom-10 -right-10 size-56 rounded-full bg-violet-400/25 dark:bg-violet-600/25 orb" />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TiltCard>
              <div className="flex items-start gap-3">
                <ScanText className="mt-0.5 size-5 text-primary" />
                <div>
                  <h3 className="font-medium">Smart CV Insights</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload your CV and get instant, actionable improvements.
                  </p>
                </div>
              </div>
            </TiltCard>
            <TiltCard>
              <div className="flex items-start gap-3">
                <Bot className="mt-0.5 size-5 text-primary" />
                <div>
                  <h3 className="font-medium">Job Recommendations</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Curated roles matched to your skills and goals.
                  </p>
                </div>
              </div>
            </TiltCard>
            <TiltCard>
              <div className="flex items-start gap-3">
                <Mic className="mt-0.5 size-5 text-primary" />
                <div>
                  <h3 className="font-medium">Mock Interviews</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Practice with voice, timing, and tailored feedback.
                  </p>
                </div>
              </div>
            </TiltCard>
            <TiltCard>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-5 text-primary" />
                <div>
                  <h3 className="font-medium">Offer Letter Tools</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate, review, and track offers with confidence.
                  </p>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto w-full max-w-7xl px-6 pb-24 lg:px-8"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(
            [
              {
                title: "Fast onboarding",
                desc: "Connect your CV and profile—become job‑ready in minutes.",
                Icon: Rocket,
              },
              {
                title: "Human + AI",
                desc: "Combine AI speed with practical, human‑centered workflows.",
                Icon: Brain,
              },
              {
                title: "Built‑in privacy",
                desc: "You control your data. No hidden sharing or tracking.",
                Icon: ShieldCheck,
              },
            ] as const
          ).map(({ title, desc, Icon }, i) => (
            <motion.div
              key={i}
              className="rounded-xl border bg-card/70 p-6 backdrop-blur"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                ease: [0.2, 0.8, 0.2, 1],
                delay: i * 0.06,
              }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center rounded-md bg-primary/10 p-2 text-primary ring-1 ring-primary/20">
                  <Icon className="size-4" />
                </span>
                <h4 className="text-base font-semibold">{title}</h4>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-28 lg:px-8">
        <div className="reveal relative overflow-hidden rounded-2xl border bg-linear-to-br from-primary/10 via-background to-background p-8 md:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/20 blur-2xl" />
          <h2 className="text-balance text-2xl font-semibold sm:text-3xl">
            Ready to accelerate your career?
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Join Karir Flow and turn your experience into momentum. It’s free to
            start.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button className="group" asChild>
              <Link href="/register">
                Create free account{" "}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="#features">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-7xl px-6 pb-12 text-xs text-muted-foreground lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <span>© {new Date().getFullYear()} Karir Flow</span>
          <div className="flex items-center gap-4">
            <a className="hover:underline" href="#">
              Privacy
            </a>
            <a className="hover:underline" href="#">
              Terms
            </a>
            <a className="hover:underline" href="#">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
