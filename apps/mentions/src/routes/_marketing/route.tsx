import { createFileRoute, Outlet } from "@tanstack/react-router";
import Footer from "~/components/footer";
import { Header } from "~/components/header";

export const Route = createFileRoute("/_marketing")({
  component: Layout,
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
