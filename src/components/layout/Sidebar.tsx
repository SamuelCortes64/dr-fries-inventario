"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Resumen", href: "/resumen" },
  { label: "Calendario", href: "/calendario" },
  { label: "Registrar producción", href: "/produccion" },
  { label: "Registrar envíos", href: "/envios" },
  { label: "Reportes", href: "/reportes" },
];

type SidebarProps = {
  onClose?: () => void;
  isMobile?: boolean;
};

export function Sidebar({ onClose, isMobile }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Dr Fries
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">
          Inventario Dr Fries
        </h2>
      </div>
      <nav className="flex flex-col gap-2 text-sm font-medium text-slate-600">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/resumen" && pathname === "/") ||
            (item.href !== "/resumen" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "rounded-xl px-3 py-2.5 transition min-h-[44px] flex items-center",
                isActive
                  ? "bg-sky-50 text-sky-700"
                  : "hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        Panel optimizado para producción y logística en tiempo real.
      </div>
    </>
  );

  if (isMobile) {
    return (
      <aside className="flex min-h-full w-72 flex-col gap-8 border-r border-slate-200 bg-white px-6 py-8">
        {content}
      </aside>
    );
  }

  return (
    <aside className="hidden min-h-screen w-72 flex-col gap-8 border-r border-slate-200 bg-white px-6 py-8 lg:flex">
      {content}
    </aside>
  );
}
