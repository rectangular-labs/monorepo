import {
  GitHubIcon,
  Logo,
  Menu,
  X,
} from "@rectangular-labs/ui/components/icon";
import { ThemeToggle } from "@rectangular-labs/ui/components/theme-provider";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { useIsMobile } from "@rectangular-labs/ui/hooks/use-mobile";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const menuItems = [
  { name: "Docs", href: "/docs" },
  { name: "Blog", href: "/blog" },
  { name: "About", href: "/about" },
];
export function Header() {
  const isMobile = useIsMobile();
  const [menuState, setMenuState] = useState<boolean>(false);
  useEffect(() => {
    setMenuState(!isMobile);
  }, [isMobile]);

  return (
    <header>
      <nav
        className="fixed z-20 w-full border-b backdrop-blur md:relative md:backdrop-blur-none lg:h-[70px]"
        data-state={menuState && "active"}
      >
        <div className="m-auto h-full max-w-5xl px-4 md:px-6">
          <div className="flex h-full flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                aria-label="home"
                className="flex items-center gap-2 text-muted-foreground"
                to="/"
              >
                <Logo className="size-6" /> Rectangular Labs
              </Link>

              <button
                aria-label={menuState === true ? "Close Menu" : "Open Menu"}
                className="-m-2.5 -mr-4 relative block cursor-pointer p-2.5 lg:hidden"
                onClick={() => setMenuState(!menuState)}
                type="button"
              >
                <Menu className="m-auto size-6 in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 duration-200" />
                <X className="-rotate-180 absolute inset-0 m-auto size-6 in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 scale-0 in-data-[state=active]:opacity-100 opacity-0 duration-200" />
              </button>
            </div>

            <AnimatePresence>
              {menuState && (
                <motion.div
                  animate={{ opacity: 1, scaleY: 1 }}
                  className="mb-6 block w-full flex-wrap items-center justify-end space-y-8 rounded-lg border bg-background p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent"
                  exit={{ opacity: 0, scaleY: 0.96 }}
                  initial={{ opacity: 0, scaleY: 0.96 }}
                  transition={{ duration: 0.2, ease: [0, 0, 0.28, 1] }}
                >
                  <div className="lg:pr-4">
                    <ul className="space-y-6 text-base lg:flex lg:gap-8 lg:space-y-0 lg:text-sm">
                      {menuItems.map((item) => (
                        <li key={item.name}>
                          <Link
                            className="block text-muted-foreground duration-150 hover:text-accent-foreground"
                            to={item.href}
                          >
                            <span>{item.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:border-l lg:pl-6">
                    {/* <Button asChild size="sm" variant="outline">
                      <Link to="/login">
                        <span>Login</span>
                      </Link>
                    </Button> */}
                    <Button asChild size="icon" variant="outline">
                      <a
                        href="https://github.com/rectangular-labs/"
                        rel="noopener"
                        target="_blank"
                      >
                        <GitHubIcon />
                      </a>
                    </Button>
                    <ThemeToggle variant="outline" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </header>
  );
}
