"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../dropdown-menu";

import { mobileMenuVariants, desktopNavVariants } from "./mobile-menu.styles";
import { MobileMenuProps } from "./mobile-menu.types";
import "./mobile-menu.css";

const MobileMenu = React.forwardRef<HTMLDivElement, MobileMenuProps>(
  ({ className, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth > 768) {
          setIsOpen(false);
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const childrenArray = React.Children.toArray(children);

    return (
      <div className={cn(mobileMenuVariants(), className)} ref={ref} {...props}>
        <div className="md:hidden">
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mobile-menu-hamburger p-2"
                aria-label="Alternar menu"
              >
                <Menu size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 mobile-menu-dropdown"
              sideOffset={8}
            >
              {childrenArray.map((child, index) => (
                <DropdownMenuItem
                  key={index}
                  className="mobile-menu-item p-0"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="w-full p-2" onClick={() => setIsOpen(false)}>
                    {child}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={desktopNavVariants()}>{children}</div>
      </div>
    );
  }
);
MobileMenu.displayName = "MobileMenu";

export { MobileMenu };
export type { MobileMenuProps };
