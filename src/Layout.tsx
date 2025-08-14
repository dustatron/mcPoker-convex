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
              <h1 className="text-xl font-bold text-primary">🃏 mcPoker</h1>
            </a>
          </div>
          <div className="flex items-center gap-4">
            {menu}
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main className="flex grow flex-col">{children}</main>
      <footer className="border-t hidden sm:block">
        <div className="container py-4 text-sm leading-loose">
          Built with ❤️ at{" "}
          <FooterLink href="https://www.convex.dev/">Convex</FooterLink>.
          Powered by Convex,{" "}
          <FooterLink href="https://vitejs.dev">Vite</FooterLink>,{" "}
          <FooterLink href="https://react.dev/">React</FooterLink> and{" "}
          <FooterLink href="https://ui.shadcn.com/">shadcn/ui</FooterLink>. The
          source code is available on{" "}
          <FooterLink href="https://github.com/get-convex/convex-auth-example/">
            GitHub
          </FooterLink>
          .
        </div>
      </footer>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="underline underline-offset-4 hover:no-underline"
      target="_blank"
    >
      {children}
    </a>
  );
}
