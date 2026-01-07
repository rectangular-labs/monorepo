import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Footer } from "./-components/footer";
import { Header } from "./-components/header";

export const Route = createFileRoute("/_marketing")({
  component: Layout,

  head: () => ({
    scripts: [
      {
        src:
          "https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=" +
          Math.random().toString(36).substring(7),
        async: true,
        defer: true,
        onLoad: () =>
          // biome-ignore lint/suspicious/noExplicitAny: apollo tracking
          (window as any).trackingFunctions.onLoad({
            appId: "68e8553db8cc65001148717d",
          }),
      },
    ],
  }),
});

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
