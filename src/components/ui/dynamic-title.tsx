"use client";

import { useEffect } from "react";
import { useFamily } from "@/src/context/family";
import { usePathname } from "next/navigation";

interface DynamicTitleProps {
  baseTitle?: string;
}

export function DynamicTitle({
  baseTitle = "Baby Control",
}: DynamicTitleProps) {
  const { family } = useFamily();
  const pathname = usePathname();

  useEffect(() => {
    const isInFamilyApp =
      pathname &&
      /^\/[^\/]+\/?/.test(pathname) &&
      !pathname.startsWith("/home");

    const updateTitle = () => {
      if (isInFamilyApp && family?.name) {
        document.title = `${baseTitle} - ${family.name}`;
      } else {
        document.title = baseTitle;
      }
    };

    updateTitle();
    const timeoutId = setTimeout(updateTitle, 100);
    return () => clearTimeout(timeoutId);
  }, [family?.name, pathname, baseTitle]);

  return null;
}
