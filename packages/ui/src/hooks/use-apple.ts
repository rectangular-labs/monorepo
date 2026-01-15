import * as React from "react";

export function useIsApple() {
  const [isApple, setIsApple] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    if (typeof navigator === "undefined") {
      setIsApple(false);
      return;
    }
    const platform =
      // @ts-expect-error - userAgentData is not shipped a property in typescript
      navigator.userAgentData?.platform ?? navigator.platform ?? "";
    setIsApple(/mac|iphone|ipad|ipod/i.test(platform));
  }, []);

  return !!isApple;
}
