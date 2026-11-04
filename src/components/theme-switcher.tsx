"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

const themes = [
  { key: "", label: "默认", color: "#ffffff", border: "#e2e8f0" },
  { key: "theme-green", label: "豆沙绿", color: "#d4e8d0", border: "#a8d5a0" },
  { key: "theme-solarized", label: "Solarized", color: "#fdf6e3", border: "#d4c9a8" },
  { key: "theme-warm", label: "暖黄色", color: "#f5e6c8", border: "#d4b896" },
  { key: "theme-dark", label: "深色", color: "#1e293b", border: "#334155" },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ruoyi-next-theme") || "";
    setCurrentTheme(saved);
    if (saved) {
      document.documentElement.classList.add(saved);
    }
  }, []);

  const setTheme = (key: string) => {
    // Remove all theme classes
    themes.forEach((t) => {
      if (t.key) document.documentElement.classList.remove(t.key);
    });

    // Add new theme class
    if (key) {
      document.documentElement.classList.add(key);
    }

    localStorage.setItem("ruoyi-next-theme", key);
    setCurrentTheme(key);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        title="切换主题"
      >
        <Palette className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-40 rounded-lg border bg-card shadow-lg p-2 space-y-1">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            选择主题
          </div>
          {themes.map((theme) => (
            <button
              key={theme.key || "default"}
              onClick={() => setTheme(theme.key)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors ${
                currentTheme === theme.key
                  ? "bg-muted"
                  : "hover:bg-muted/50"
              }`}
            >
              <div
                className="h-4 w-4 rounded-full border"
                style={{
                  backgroundColor: theme.color,
                  borderColor: theme.border,
                }}
              />
              {theme.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}