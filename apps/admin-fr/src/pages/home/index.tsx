import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tv, Zap, Globe, Shield, Play, Check, Menu, X } from "lucide-react";
import { useUser } from "@/services/hooks/use-user";
import { cn } from "@/utils/cn";
import ActionButton from "@/components/buttons/action-btn";

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
      className="relative flex min-h-dvh w-full flex-col overflow-y-auto text-primary-foreground"
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
              {/* <Tv className="w-8 h-8 text-primary" /> */}
              <span className="text-2xl font-bold">Pride Spaces</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-1 items-center px-4 pb-20 pt-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              The Future of
              <span className="text-primary"> Real Estate</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#a6b5c2] mb-8">
              Visit 900+ companies office spaces.
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
                  Login here
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

      {/* Footer */}
      <footer className="shrink-0 bg-card py-12 px-4 border-t border-input">
        <div className="max-w-7xl mx-auto text-center text-[#a6b5c2]">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Tv className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-[#f4f7fa]">Pride Spaces</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 pb-4">
            <Link className="hover:text-primary" to={"/terms"}>
              Terms & Conditions
            </Link>
            <Link className="hover:text-primary" to={"/privacy-policy"}>
              Privacy Policy
            </Link>
          </div>
          <p>© 2026 Pride Spaces. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
