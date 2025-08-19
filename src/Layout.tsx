import { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Layout({
  menu,
  children,
}: {
  menu?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex min-h-20 border-b bg-background/80 backdrop-blur">
        <nav className="container w-full justify-between flex flex-row items-center gap-6">
          <div className="flex items-center gap-6 md:gap-10">
            <a href="/">
              <h1 className="text-xl font-bold text-primary">🃏 McPoker</h1>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <div className="mr-auto">{menu}</div>
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main className="flex grow flex-col">{children}</main>
      <footer className="border-t hidden sm:block">
        <div className="container py-4 text-sm leading-loose">
          Built with by Dusty McCord
        </div>
      </footer>
    </div>
  );
}
