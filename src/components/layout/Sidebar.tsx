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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Clients', icon: Users, href: '/clients' },
  { label: 'Invoices', icon: FileText, href: '/invoices' },
  { label: 'Quotes', icon: FileText, href: '/quotes' },
  { label: 'Income', icon: CreditCard, href: '/income' },
  { label: 'Income Categories', icon: Tags, href: '/income-categories' },
  { label: 'Expenses', icon: Receipt, href: '/expenses' },
  { label: 'Expense Categories', icon: FolderTree, href: '/expense-categories' },
  { label: 'Recurring', icon: RefreshCw, href: '/recurring-transactions' },
  { label: 'Reports', icon: LineChart, href: '/reports' },
  { label: 'Company', icon: Building, href: '/company' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card h-screen p-4 border-r space-y-4 hidden md:block">
      <div className="text-2xl font-bold mb-4">Summit</div>
      <nav className="space-y-1">
        {navItems.map((item) => (
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
      </nav>
    </div>
  );
} 