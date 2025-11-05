import { cn } from "@rectangular-labs/ui/utils/cn";
import { createLink, Link, type LinkComponent } from "@tanstack/react-router";

const CreatedLinkComponent = createLink(Link);

export const NavLink: LinkComponent<typeof Link> = (props) => {
  return (
    <CreatedLinkComponent
      activeProps={{
        ...props.activeProps,
        className: cn(
          "text-foreground after:absolute after:bottom-[-8px] after:left-0 after:h-[2px] after:w-full after:bg-current after:content-['']",
          props.activeProps &&
            "className" in props.activeProps &&
            props.activeProps.className &&
            props.activeProps.className,
        ),
      }}
      className={cn(
        "relative transition-colors hover:text-foreground",
        props.className,
      )}
      {...props}
    />
  );
};
