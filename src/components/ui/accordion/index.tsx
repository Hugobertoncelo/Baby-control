import * as React from "react";
import { cn } from "@/src/lib/utils";
import { useTheme } from "@/src/context/theme";
import { accordionStyles } from "./accordion.styles";
import {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
} from "./accordion.types";
import { ChevronDown } from "lucide-react";
import "./accordion.css";

const AccordionContext = React.createContext<{
  value: string | null;
  onValueChange: (value: string) => void;
  type: "single" | "multiple";
  collapsible: boolean;
}>({
  value: null,
  onValueChange: () => {},
  type: "single",
  collapsible: false,
});

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      className,
      type = "single",
      value,
      defaultValue,
      onValueChange,
      collapsible = false,
      children,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();

    const [internalValue, setInternalValue] = React.useState<
      string | string[] | null
    >(defaultValue || (type === "multiple" ? [] : null));

    const actualValue =
      value !== undefined
        ? value
        : internalValue || (type === "multiple" ? [] : "");

    const handleValueChange = React.useCallback(
      (itemValue: string) => {
        if (onValueChange) {
          if (type === "multiple") {
            const newValue = Array.isArray(actualValue)
              ? actualValue.includes(itemValue)
                ? actualValue.filter((v) => v !== itemValue)
                : [...actualValue, itemValue]
              : [itemValue];
            onValueChange(newValue);
          } else {
            onValueChange(
              actualValue === itemValue && collapsible ? "" : itemValue
            );
          }
        } else {
          if (type === "multiple") {
            setInternalValue((prev) => {
              const array = Array.isArray(prev) ? prev : [];
              return array.includes(itemValue)
                ? array.filter((v) => v !== itemValue)
                : [...array, itemValue];
            });
          } else {
            setInternalValue((prev) =>
              prev === itemValue && collapsible ? "" : itemValue
            );
          }
        }
      },
      [actualValue, collapsible, onValueChange, type]
    );

    const contextValue = React.useMemo(
      () => ({
        value:
          type === "multiple"
            ? Array.isArray(actualValue)
              ? actualValue.join(",")
              : ""
            : String(actualValue || ""),
        onValueChange: handleValueChange,
        type,
        collapsible,
      }),
      [actualValue, handleValueChange, type, collapsible]
    );

    return (
      <AccordionContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            accordionStyles.root,
            className,
            theme === "dark" && "accordion-dark"
          )}
          {...props}
        >
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);

Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { theme } = useTheme();
    const context = React.useContext(AccordionContext);

    const isExpanded =
      context.type === "multiple"
        ? context.value && context.value.split(",").includes(value)
        : context.value === value;

    return (
      <div
        ref={ref}
        data-state={isExpanded ? "abrir" : "fechada"}
        className={cn(
          accordionStyles.item,
          className,
          theme === "dark" && "accordion-item-dark"
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(({ className, children, ...props }, ref) => {
  const { theme } = useTheme();
  const itemContext = React.useContext(AccordionContext);

  const accordionItemElement = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      if (node) {
        let parent = node.parentElement;
        while (parent && !parent.hasAttribute("data-state")) {
          parent = parent.parentElement;
        }
        accordionItemElement.current = parent as HTMLDivElement;
      }

      if (ref) {
        if (typeof ref === "function") {
          ref(node);
        } else {
          ref.current = node;
        }
      }
    },
    [ref]
  );

  const handleClick = () => {
    if (accordionItemElement.current) {
      const value =
        accordionItemElement.current.getAttribute("data-value") || "";
      itemContext.onValueChange(value);
    }
  };

  const isExpanded =
    accordionItemElement.current?.getAttribute("data-state") === "open";

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      className={cn(
        accordionStyles.trigger,
        className,
        theme === "dark" && "accordion-trigger-dark"
      )}
      aria-expanded={isExpanded}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          accordionStyles.icon,
          isExpanded && accordionStyles.iconExpanded,
          theme === "dark" && "accordion-icon-dark"
        )}
      />
    </button>
  );
});

AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({ className, children, ...props }, ref) => {
  const { theme } = useTheme();

  const [isExpanded, setIsExpanded] = React.useState(false);
  const contentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        let parent = node.parentElement;
        while (parent && !parent.hasAttribute("data-state")) {
          parent = parent.parentElement;
        }

        if (parent) {
          setIsExpanded(parent.getAttribute("data-state") === "open");
        }
      }

      if (ref) {
        if (typeof ref === "function") {
          ref(node);
        } else {
          ref.current = node;
        }
      }
    },
    [ref]
  );

  return (
    <div
      ref={contentRef}
      className={cn(
        accordionStyles.content,
        !isExpanded && accordionStyles.contentClosed,
        className,
        theme === "dark" && "accordion-content-dark"
      )}
      data-state={isExpanded ? "open" : "closed"}
      {...props}
    >
      <div className={accordionStyles.contentInner}>{children}</div>
    </div>
  );
});

AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
