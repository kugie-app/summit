'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CreditCard,
  LineChart,
  Settings,
  Building,
  RefreshCw,
  Tags,
  FolderTree,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useTheme } from 'next-themes';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Clients', icon: Users, href: '/clients', group: 'Configuration' },
  { label: 'Vendors', icon: Store, href: '/vendors', group: 'Configuration' },
  { label: 'Income Categories', icon: Tags, href: '/income-categories', group: 'Configuration' },
  { label: 'Expense Categories', icon: FolderTree, href: '/expense-categories', group: 'Configuration' },
  { label: 'Quotes', icon: FileText, href: '/quotes', group: 'Transactions' },
  { label: 'Invoices', icon: FileText, href: '/invoices', group: 'Transactions' },
  { label: 'Income', icon: CreditCard, href: '/income', group: 'Transactions' },
  { label: 'Expenses', icon: Receipt, href: '/expenses', group: 'Transactions' },
  { label: 'Recurring', icon: RefreshCw, href: '/recurring-transactions', group: 'Transactions' },
  // { label: 'Reports', icon: LineChart, href: '/reports' },
  { label: 'Settings', icon: Settings, href: '/settings', group: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  const logoSrc = isDarkMode ? '/logomark_dark.png' : '/logomark.png';

  const groupedNavItems = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    const group = item.group || 'General';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <div className="w-64 bg-card h-screen p-4 border-r space-y-4 hidden md:block">
      <div className="text-2xl font-bold mb-4">
        <Image src={logoSrc} alt="Summit" width={200} height={200} />
      </div>
      <nav className="space-y-4">
        {Object.entries(groupedNavItems).map(([group, items]) => (
          <div key={group}>
            <div className="text-sm font-semibold text-muted-foreground mb-2">{group}</div>
            <div className="space-y-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
} 