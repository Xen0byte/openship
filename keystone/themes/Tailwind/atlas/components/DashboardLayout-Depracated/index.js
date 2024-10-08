import { useState } from "react";
import { useKeystone } from "@keystone/keystoneProvider";
import { SideBarUI, Sidebar } from "./Sidebar";
import { AppProvider, useAppProvider } from "./AppProvider";
import ThemeToggle from "./ThemeToggle";
import { Separator } from "../../primitives/default/ui/separator";
import { Button } from "../../primitives/default/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../../primitives/default/ui/sheet";
import { RiMenuLine } from "@remixicon/react";
import { Logo } from "../Logo";

export const HEADER_HEIGHT = 80;

export const DashboardLayout = ({ children }) => {
  const {
    adminMeta: { lists },
    adminConfig,
    authenticatedItem,
    visibleLists,
  } = useKeystone();

  if (visibleLists.state === "loading") return null;
  // This visible lists error is critical and likely to result in a server restart
  // if it happens, we'll show the error and not render the navigation component/s
  if (visibleLists.state === "error") {
    return (
      <span className="text-red-600 dark:text-red-500 text-sm">
        {visibleLists.error instanceof Error
          ? visibleLists.error.message
          : visibleLists.error[0].message}
      </span>
    );
  }
  const renderableLists = Object.keys(lists)
    .map((key) => {
      if (!visibleLists.lists.has(key)) return null;
      return lists[key];
    })
    .filter((x) => Boolean(x));


  if (adminConfig?.components?.Navigation) {
    return (
      <adminConfig.components.Navigation
        authenticatedItem={authenticatedItem}
        lists={renderableLists}
      />
    );
  }

  const sidebarNav = renderableLists.map((list) => ({
    title: list.label,
    href: `/${list.path}${list.isSingleton ? "/1" : ""}`,
  }));

  return (
    <AppProvider>
      <main>
        <section>
          <Sidebar
            sidebarNav={sidebarNav}
            authenticatedItem={authenticatedItem}
          />

          <div className="min-h-screen md:grow md:pl-64 lg:pl-72">
            <header className="z-10 sticky top-0 flex h-14 items-center gap-4 border-b bg-[#fafbfb] dark:bg-[#0e1421] px-4 lg:h-[60px] lg:px-6">
              <div className="flex gap-3 items-center md:hidden">
                <MobileSheet sidebarNav={sidebarNav} />
                {/* <Separator
                  orientation="vertical"
                  className="h-6 w-[.1rem] bg-zinc-300 dark:bg-zinc-700"
                /> */}
                <Logo size="lg" />
              </div>
              <div className="ml-auto">
                <ThemeToggle authenticatedItem={authenticatedItem} />
              </div>
            </header>
            <div className="h-full p-4">{children}</div>
          </div>
        </section>
      </main>
    </AppProvider>
  );
};
function MobileSheet({ sidebarNav }) {
  const { sidebarOpen, setSidebarOpen } = useAppProvider();

  return (
    <Sheet open={sidebarOpen} onOpenChange={() => setSidebarOpen(!sidebarOpen)}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="px-1.5">
          {sidebarOpen}
          <RiMenuLine className="h-3.5 w-3.5"/>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pt-4">
        <SideBarUI
          sidebarNav={sidebarNav}
          scrollHeight="max-h-[calc(100vh-150px)]"
        />
      </SheetContent>
    </Sheet>
  );
}
