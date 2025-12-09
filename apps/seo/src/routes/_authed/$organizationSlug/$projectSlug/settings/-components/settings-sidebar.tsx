import { NavLink } from "~/routes/_authed/-components/nav-link";

export function SettingsSidebar(params: {
  organizationSlug: string;
  projectSlug: string;
}) {
  return (
    <aside className="shrink-0 pt-6 pr-4 md:w-64 md:border-r">
      <div className="mb-4">
        <h2 className="font-semibold text-lg">Settings</h2>
      </div>
      <nav className="flex flex-col gap-6 text-muted-foreground text-sm">
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
          to="/$organizationSlug/$projectSlug/settings/article-settings"
        >
          Article Settings
        </NavLink>
      </nav>
    </aside>
  );
}
