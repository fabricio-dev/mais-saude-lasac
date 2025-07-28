"use client";
import {
  Building2,
  IdCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/use-permissions";
import { authClient } from "@/lib/auth-client";

// Menu items.
const baseItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    requiresAdmin: true,
  },

  {
    title: "Convênios",
    url: "/patients",
    icon: IdCard,
    requiresAdmin: true,
  },
  {
    title: "Vendedores",
    url: "/sellers",
    icon: Users,
    requiresAdmin: true,
  },
  {
    title: "Unidades",
    url: "/clinics",
    icon: Building2,
    requiresAdmin: true,
  },
  {
    title: "Gestão",
    url: "/management",
    icon: Settings,
    requiresAdmin: true,
  },
  {
    title: "Admin",
    url: "/admin",
    icon: Shield,
    requiresAdmin: true,
  },
  //vendedor
  {
    title: "Dashboard",
    url: "/vendedor/dashboard-seller",
    icon: LayoutDashboard,
    requiresUser: true,
  },
  {
    title: "Convênios",
    url: "/vendedor/patients-seller",
    icon: IdCard,
    requiresUser: true,
  },
];

export function AppSidebar() {
  const router = useRouter();
  const session = authClient.useSession();
  const pathname = usePathname();
  // const { isAdmin, userRole } = usePermissions(); mudei par o de baixo
  const { isAdmin } = usePermissions();

  // Filtrar itens do menu baseado nas permissões do usuário
  const items = baseItems.filter((item) => {
    if (item.requiresAdmin) {
      return isAdmin;
    }
    if (item.requiresUser) {
      return session.data?.user.role === "user";
    }
    return true;
  });

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
        },
      },
    });
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-6">
        <Image
          src="/logo.svg"
          alt="Mais Saude Lasac Logo"
          width={100}
          height={100}
          className="h-full w-full"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar>
                    <AvatarFallback>
                      {session.data?.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="tsm">{session.data?.user.name}</p>
                      {isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="tsm text-muted-foreground">
                      {session.data?.user.email}
                    </p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
