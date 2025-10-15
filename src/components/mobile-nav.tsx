"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, FileText, User, Settings, Download, Home } from "lucide-react";
import { usePathname } from "next/navigation";

interface MobileNavProps {
  onExport?: () => void;
}

export function MobileNav({ onExport }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/logs", label: "Logs", icon: FileText },
    { href: "/personal", label: "Personal", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleMenuToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = () => {
    setIsOpen(false);
  };

  const handleExportClick = () => {
    onExport?.();
    setIsOpen(false);
  };

  // Scroll detection for showing/hiding hamburger button
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show button when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } 
      // Hide button when scrolling down (but not at the very top)
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  return (
    <>
      {/* Floating Hamburger Button */}
      <div 
        className={`fixed top-20 left-4 z-50 md:hidden transition-all duration-300 ease-in-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[-100px] opacity-0'
        }`}
      >
        <div className="mb-4">
          <Button
            onClick={handleMenuToggle}
            size="lg"
            className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 border-2 border-white/20 backdrop-blur-sm"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-7 w-7" />
            ) : (
              <Menu className="h-7 w-7" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={handleMenuToggle}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-0 left-0 h-full w-80 max-w-[85vw] bg-background border-r border-border shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pt-8 border-b border-border">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMenuToggle}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 p-6 space-y-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleMenuItemClick}
                    >
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className="w-full justify-start h-14 text-left text-base"
                      >
                        <Icon className="h-5 w-5 mr-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}

                {/* Export Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start h-14 text-left text-base"
                  onClick={handleExportClick}
                >
                  <Download className="h-5 w-5 mr-4" />
                  Export
                </Button>
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Zaalimmmm Shawarma Dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
