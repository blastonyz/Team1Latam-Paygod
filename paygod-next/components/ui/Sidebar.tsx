"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldCheck,
  ScrollText,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { MOCK_INSTITUTION } from "@/lib/mockAuth";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

export const APP_NAV: NavItem[] = [
  { to: "/app/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/app/transfers", label: "Transfers", icon: ArrowLeftRight },
  { to: "/app/compliance", label: "Compliance", icon: ShieldCheck },
  { to: "/app/audit-log", label: "Audit Log", icon: ScrollText },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon },
];

export const Sidebar: React.FC<{
  onLogout?: () => void;
  open?: boolean;
  onClose?: () => void;
  navTop?: number;
  width?: number;
}> = ({ onLogout, open = false, onClose, navTop = 64, width = 240 }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-200 md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed left-0 bg-black flex flex-col z-40 transition-transform duration-200 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          top: navTop,
          bottom: 0,
          width,
          borderRight: "1px solid var(--border)",
        }}
      >
        <nav className="flex-1 overflow-y-auto" style={{ padding: "24px 12px" }}>
          {APP_NAV.map((item) => {
            const isActive = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onClose}
                className={cn(
                  "relative flex items-center text-sm transition-colors duration-150",
                  isActive
                    ? "text-white bg-[var(--surface)]"
                    : "text-[#888] hover:text-white hover:bg-[rgba(255,255,255,0.03)]",
                )}
                style={{ gap: 12, padding: "0 16px", height: 40, marginBottom: 2 }}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-0 bottom-0"
                    style={{ width: 2, backgroundColor: "#ED3134" }}
                  />
                )}
                <Icon size={16} strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0" style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
          <div className="bg-[var(--surface)] min-w-0" style={{ border: "1px solid var(--border)", padding: 14 }}>
            <div className="text-white font-medium truncate" style={{ fontSize: 13 }}>
              {MOCK_INSTITUTION.name}
            </div>
            <div className="font-mono truncate" style={{ color: "#888", fontSize: 11, marginTop: 6 }}>
              {MOCK_INSTITUTION.walletShort}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" style={{ marginTop: 12 }} onClick={onLogout}>
            <LogOut size={14} strokeWidth={1.5} />
            <span>Disconnect</span>
          </Button>
        </div>
      </aside>
    </>
  );
};
