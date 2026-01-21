import { NavLink } from "~/routes/_authed/-components/nav-link";

export function SettingsSidebar(params: {
  organizationSlug: string;
  projectSlug: string;
}) {
  return (
    <aside className="shrink-0 px-4 pt-6 md:sticky md:top-0 md:h-fit md:min-h-[calc(100vh-100px)] md:w-64 md:border-r">
      <div className="mb-4">
        <h2 className="font-semibold text-lg">Settings</h2>
      </div>
      <nav className="flex flex-col gap-6 text-muted-foreground text-sm">
        <NavLink
          params={params}
          to="/$organizationSlug/$projectSlug/settings/project"
        >
          Project
        </NavLink>
        <NavLink
          params={params}
          to="/$organizationSlug/$projectSlug/settings/publishing-settings"
        >
          Publishing
        </NavLink>
        <NavLink
          params={params}
          to="/$organizationSlug/$projectSlug/settings/integrations"
        >
          Integrations
        </NavLink>
        <NavLink
          activeOptions={{
            exact: true,
          }}
          params={params}
          to="/$organizationSlug/$projectSlug/settings"
        >
          Business Background
        </NavLink>
        <NavLink
          params={params}
          to="/$organizationSlug/$projectSlug/settings/image-settings"
        >
          Image Settings
        </NavLink>
        <NavLink
          params={params}
          to="/$organizationSlug/$projectSlug/settings/writing-settings"
        >
          Writing Settings
        </NavLink>
      </nav>
    </aside>
  );
}
