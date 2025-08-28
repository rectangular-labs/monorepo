import React from "react";
import { useMemo } from "react";

type ShortcutModifier = "ctrl" | "alt" | "shift";
type ShortcutKey =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z"
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | ","
  | "/"
  | ";"
  | "'"
  | "["
  | "]";
type ShortcutKeys =
  | ShortcutKey
  | `${ShortcutModifier}-${ShortcutKey}`
  | `${ShortcutModifier}-${ShortcutModifier}-${ShortcutKey}`;

const MAC_SYMBOLS: Record<ShortcutModifier, string> = {
  ctrl: "⌘",
  alt: "⌥",
  shift: "⇧",
};

const formatShortcutKey = (key: string, isMac: boolean) => {
  if (isMac) {
    const lowerKey = key.toLowerCase();
    if (Object.keys(MAC_SYMBOLS).includes(lowerKey)) {
      return MAC_SYMBOLS[lowerKey as ShortcutModifier];
    }
    return key.toUpperCase();
  }

  return key.charAt(0).toUpperCase() + key.slice(1);
};

const parseShortcutKeys = (shortcutKeys: ShortcutKeys, isMac: boolean) => {
  return shortcutKeys
    .split("-")
    .map((key) => key.trim())
    .map((key) => formatShortcutKey(key, isMac));
};

function ShortcutCombo({ shortcutKeys }: { shortcutKeys: string[] }) {
  return shortcutKeys.map((shortcut, index) => {
    return (
      // biome-ignore lint/suspicious/noArrayIndexKey: We need to use the index as a key to avoid re-rendering the component
      <span key={`${shortcut}-${index}`}>
        {index > 0 && <kbd>+</kbd>}
        <kbd>{shortcut}</kbd>
      </span>
    );
  });
}

function ShortcutDisplay({
  shortcutCombos,
}: {
  shortcutCombos: ShortcutKeys[];
}) {
  const isMac = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      navigator.platform.toLowerCase().includes("mac"),
    [],
  );

  const parsedShortcuts = useMemo(
    () => shortcutCombos.map((shortcut) => parseShortcutKeys(shortcut, isMac)),
    [shortcutCombos, isMac],
  );

  if (shortcutCombos.length === 0) return null;

  return (
    <div>
      {parsedShortcuts.map((shortcutCombo, index) => {
        return (
          <React.Fragment key={`${shortcutCombo}`}>
            {index > 0 && <span> then </span>}
            <ShortcutCombo shortcutKeys={shortcutCombo} />
          </React.Fragment>
        );
      })}
    </div>
  );
}

export { ShortcutDisplay, type ShortcutKeys };
