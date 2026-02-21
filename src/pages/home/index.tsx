import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tv, Zap, Globe, Shield, Play, Check, Menu, X } from "lucide-react";
import { useUser } from "@/services/hooks/use-user";
import { cn } from "@/utils/cn";
import ActionButton from "@/components/buttons/action-btn";

const features = [
  {
    icon: Tv,
    title: "900+ Channels",
    description:
      "Access premium channels from around the regions in stunning quality",
  },
  {
    icon: Zap,
    title: "MAX HD Quality",
    description: "Crystal clear streaming with very-less buffering or lag",
  },
  {
    icon: Globe,
    title: "Regional Coverage",
    description: "Watch content from any region, any time, anywhere",
  },
  {
    icon: Shield,
    title: "99.9% Uptime",
    description: "Reliable service with enterprise-grade infrastructure",
  },
];

const plans = [
  {
    name: "Consumer",
    price: "105",
    popular: true,
    features: ["900+ Channels", "Max HD Quality", "1 Device", "24/7 Support"],
  },
  {
    name: "Reseller",
    price: "65",
    features: [
      "900+ Channels",
      "Max HD Quality",
      "Multiple Consumers",
      "Priority Support",
    ],
  },
  //   {
  //     name: "Family",
  //     price: "29.99",
  //     features: [
  //       "15,000+ Channels",
  //       "4K Ultra HD",
  //       "Unlimited Devices",
  //       "VIP Support",
  //       "Premium VOD",
  //       "Sports Package",
  //     ],
  //   },
];

const apps = [
  {
    title: "OTT Navigator",
    link: "https://liteapks.com/download/ott-navigator-iptv-518",
  },
  {
    title: "OTT Player",
    link: "https://liteapks.com/download/ott-player-741820/1",
  },
  {
    title: "Sparkle TV",
    link: "https://www.apkmirror.com/apk/hede-konsulttjanst-ab/sparkle-tv-iptv-player/sparkle-tv-iptv-player-2-2-1-release/sparkle-tv-iptv-player-2-2-1-android-apk-download/",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const divRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  const { isTokenValid } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = divRef.current;
    if (el) {
      const handleScroll = () => {
        // console.log(el.scrollTop);
        setScrolled(el.scrollTop > 50);
      };
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [divRef.current]);

  return (
    <div
      className="relative text-primary-foreground w-full max-h-full overflow-y-auto"
      ref={divRef}
    >
      {/* Navigation */}
      <nav
        className={cn(
          `fixed top-0 w-full z-50 transition-all duration-300 h-[65px]`,
          scrolled ? "bg-card/75 backdrop-blur-sm shadow-lg" : "bg-card"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Tv className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">Beiz Panel</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="hover:text-primary transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="hover:text-primary transition-colors"
              >
                Pricing
              </a>
              <a
                href="#contact"
                className="hover:text-primary transition-colors"
              >
                Contact
              </a>
              <ActionButton
                onClick={() => {
                  navigate(isTokenValid ? "/dashboard" : "/login");
                }}
              >
                {isTokenValid ? "Dashboard" : "Login"}
              </ActionButton>
            </div>
            {isMobile && (
              <ActionButton
                variant={"ghost"}
                className="px-6 py-5"
                onClick={() => {
                  setIsMenuOpen((prev) => !prev);
                }}
              >
                {isMenuOpen ? (
                  <X className="size-6" />
                ) : (
                  <Menu className="size-6" />
                )}
              </ActionButton>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobile && isMenuOpen && (
          <div className="md:hidden bg-card border-t border-input">
            <div className="px-4 py-4 space-y-3 flex flex-col gap-2 items-center">
              <a
                href="#features"
                className="block hover:text-primary transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block hover:text-primary transition-colors"
              >
                Pricing
              </a>
              <a
                href="#contact"
                className="block hover:text-primary transition-colors"
              >
                Contact
              </a>
              <ActionButton
                className="max-w-fit text-lg py-6 px-7"
                onClick={() => {
                  navigate(isTokenValid ? "/dashboard" : "/login");
                }}
              >
                {isTokenValid ? "Dashboard" : "Login"}
              </ActionButton>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              The Future of
              <span className="text-primary"> Entertainment</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#a6b5c2] mb-8">
              Stream 900+ channels in stunning quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ActionButton
                variant={"outline"}
                className="text-xl px-7 py-6"
                onClick={() => {
                  navigate(isTokenValid ? "/dashboard" : "/login");
                }}
              >
                <div className="flex items-center gap-2">
                  Play Yours
                  <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </ActionButton>
              {/* <ActionButton className="text-xl px-7 py-6">
                Watch Demo
              </ActionButton> */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose Beiz Panel?
            </h2>
            <p className="text-xl text-[#a6b5c2]">
              Experience television reimagined for the modern age
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#0f171c] p-8 rounded-xl border border-input hover:border-primary transition-all hover:transform hover:scale-105"
              >
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-[#a6b5c2]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-[#a6b5c2]">
              Choose the plan that's right for you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`flex flex-col bg-card p-8 rounded-xl border-2 transition-all hover:transform hover:scale-105 ${
                  plan.popular
                    ? "border-primary shadow-lg shadow-primary/20"
                    : "border-input"
                }`}
              >
                {plan.popular && (
                  <div className="w-fit bg-primary text-center py-1 px-3 rounded-full text-sm font-semibold mb-4 inline-block">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">₹{plan.price}</span>
                  <span className="text-[#a6b5c2]">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <ActionButton
                  variant={plan.popular ? "default" : "secondary"}
                  className={"text-lg px-7 py-6 mt-auto"}
                  onClick={() => {
                    navigate(isTokenValid ? "/dashboard" : "/login");
                  }}
                >
                  Get Started
                </ActionButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APKS Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-[#3a6699]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Support?</h2>
          <p className="text-xl mb-8 opacity-90">
            We Currently Support OTT Navigator, OTT Player and Sparkle TV
          </p>
          <div className="flex flex-col gap-2 items-center">
            {apps.map((app, i) => (
              <Link
                className="px-7 py-5 rounded-lg text-lg font-semibold transition-all transform cursor-pointer bg-background text-secondary-foreground hover:bg-secondary"
                to={app.link}
                target="_blank"
              >
                {`Download ${app.title}`}
              </Link>
            ))}
            {/* <ActionButton
              variant={"outline"}
              className="px-8 py-6 rounded-lg text-lg font-semibold transition-all transform"
            >
              Download OTT Navigator
            </ActionButton>
            <ActionButton
              variant={"outline"}
              className="px-8 py-6 rounded-lg text-lg font-semibold transition-all transform"
            >
              Download OTT Player
            </ActionButton> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-12 px-4 border-t border-input">
        <div className="max-w-7xl mx-auto text-center text-[#a6b5c2]">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Tv className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-[#f4f7fa]">Beiz Panel</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 pb-4">
            <Link className="hover:text-primary" to={"/terms"}>
              Terms & Conditions
            </Link>
            <Link className="hover:text-primary" to={"/privacy-policy"}>
              Privacy Policy
            </Link>
          </div>
          <p>© 2025 Beiz Panel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
