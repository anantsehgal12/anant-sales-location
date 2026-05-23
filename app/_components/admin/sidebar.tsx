import {
  Calendar,
  CirclePlus,
  Home,
  Inbox,
  Search,
  Settings,
  Tag,
  ShoppingCart,
  Package,
  Percent,
  Bell,
  ReceiptText,
  User,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

// Menu items.
const items = [
  {
    title: "Leads",
    url: "/admin/leads",
    icon: UserPlus,
  },
  {
    title: "Organisations",
    url: "/admin/org",
    icon: Package,
  },
  {
    title: "Executives",
    url: "/admin/executives",
    icon: User,
  },
];

export default function Side() {
  return (
    <section className="font-display">
      <Sidebar collapsible="icon" variant="floating">
        <SidebarHeader>
          <Link href="/">
            <main className="flex justify-center items-center gap-5 pt-1">
              <UserPlus className="w-16 h-16 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8" />
              <h1 className="group-data-[collapsible=icon]:hidden text-center font-bold text-xl">
                Anant <br />
                Sales
              </h1>
            </main>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon className="" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </section>
  );
}
