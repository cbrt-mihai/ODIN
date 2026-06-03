"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

function getNodeText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join(" ");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }
  return "";
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    searchable?: boolean;
    searchPlaceholder?: string;
  }
>(
  (
    {
      className,
      children,
      position = "popper",
      searchable = true,
      searchPlaceholder = "Search…",
      ...props
    },
    ref,
  ) => {
    const [search, setSearch] = React.useState("");

    const filteredChildren = React.useMemo(() => {
      if (!searchable || !search.trim()) return children;
      const query = search.trim().toLowerCase();
      return React.Children.toArray(children).filter((child) => {
        if (!React.isValidElement<{ children?: React.ReactNode }>(child)) {
          return true;
        }
        return getNodeText(child.props.children)
          .toLowerCase()
          .includes(query);
      });
    }, [children, search, searchable]);

    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          className={cn(
            "relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-md",
            className,
          )}
          position={position}
          onCloseAutoFocus={(e) => e.preventDefault()}
          {...props}
        >
          {searchable && (
            <div
              className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Search className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={searchPlaceholder}
                className="h-8 w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          <SelectPrimitive.Viewport
            className={cn("p-1", searchable && "max-h-60 overflow-y-auto")}
          >
            {searchable &&
            search.trim() &&
            React.Children.count(filteredChildren) === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-zinc-500">
                No results.
              </p>
            ) : (
              filteredChildren
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  },
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-zinc-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
