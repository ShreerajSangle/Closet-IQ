import { Link, useLocation } from "wouter";
import { LayoutDashboard, Shirt, Layers, History, Lightbulb, User, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/closet", label: "Closet", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: Layers },
  { href: "/history", label: "History", icon: History },
  { href: "/gap-advisor", label: "Gap Advisor", icon: Lightbulb },
  { href: "/profile", label: "Profile", icon: User },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const NavLinks = () => (
    <div className="space-y-1">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-64 border-r border-border bg-card flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">ClosetIQ</h1>
          </div>
          <div className="flex-1 px-4 overflow-y-auto">
            <NavLinks />
          </div>
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={toggleTheme}
              data-testid="btn-toggle-theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <header className="h-16 border-b border-border bg-card flex items-center px-4 justify-between shrink-0">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="btn-mobile-menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <div className="p-6">
                  <h1 className="text-2xl font-bold tracking-tight">ClosetIQ</h1>
                </div>
                <div className="flex-1 px-4 overflow-y-auto">
                  <NavLinks />
                </div>
                <div className="p-4 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={toggleTheme}
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold">ClosetIQ</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
