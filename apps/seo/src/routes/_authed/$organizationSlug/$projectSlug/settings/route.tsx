import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsSidebar } from "./-components/settings-sidebar";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/settings",
)({
  component: SettingsLayout,
});

function SettingsLayout() {
  const { organizationSlug, projectSlug } = Route.useParams();

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <SettingsSidebar
        organizationSlug={organizationSlug}
        projectSlug={projectSlug}
      />
      {/* 97px is the height of the header and padding around the page */}
      <div className="mx-auto h-full max-w-4xl flex-1 overflow-y-auto px-6 py-4 md:max-h-[calc(100vh-97px)]">
        <Outlet />
      </div>
    </div>
  );
}
