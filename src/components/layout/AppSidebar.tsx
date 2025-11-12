import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Smartphone,
  ShoppingCart,
  FileText,
  BarChart3,
  Bot,
  User,
  LogOut,
  Crown,
  Shield,
  Receipt
} from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useUserRole } from '@/hooks/useUserRole';
import { Profile } from '@/types/profile';

export const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const { isAdmin } = useAdminRole();
  const { role } = useUserRole();
  const { setOpenMobile, isMobile } = useSidebar();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setProfile(data as Profile);
    }
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      tier: 'starter_kit'
    },
    {
      title: 'Customers',
      icon: Users,
      path: '/customers',
      tier: 'starter_kit'
    },
    {
      title: 'Mobile Inventory',
      icon: Smartphone,
      path: '/inventory',
      tier: 'starter_kit'
    },
    {
      title: 'Sales',
      icon: ShoppingCart,
      path: '/sales',
      tier: 'starter_kit'
    },
    {
      title: 'Purchases',
      icon: FileText,
      path: '/purchases',
      tier: 'starter_kit'
    },
    {
      title: 'Expenses',
      icon: FileText,
      path: '/expenses',
      tier: 'dealer_pack'
    },
    {
      title: 'Reports',
      icon: BarChart3,
      path: '/reports',
      tier: 'dealer_pack'
    },
    {
      title: 'AI Assistant',
      icon: Bot,
      path: '/ai-assistant',
      tier: 'empire_plan'
    },
    {
      title: 'My Invoices',
      icon: Receipt,
      path: '/invoices',
      tier: 'starter_kit'
    }
  ];

  const adminMenuItems = [
    {
      title: 'Admin Dashboard',
      icon: Shield,
      path: '/admin'
    },
    {
      title: 'Users Management',
      icon: Users,
      path: '/admin/users'
    },
    {
      title: 'Role Management',
      icon: Shield,
      path: '/admin/roles'
    },
    {
      title: 'Subscriptions',
      icon: Crown,
      path: '/admin/subscriptions'
    },
    {
      title: 'Invoices',
      icon: Receipt,
      path: '/admin/invoices'
    },
    {
      title: 'System Logs',
      icon: FileText,
      path: '/admin/logs'
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'starter_kit': return 'bg-blue-500';
      case 'dealer_pack': return 'bg-green-500';
      case 'empire_plan': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case 'admin': return 'bg-red-500 text-white';
      case 'staff': return 'bg-blue-500 text-white';
      case 'viewer': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const canAccessFeature = (requiredTier: string) => {
    if (!profile) return requiredTier === 'starter_kit';
    
    const tierLevels = { starter_kit: 1, dealer_pack: 2, empire_plan: 3 };
    const userLevel = tierLevels[profile.subscription_tier as keyof typeof tierLevels];
    const requiredLevel = tierLevels[requiredTier as keyof typeof tierLevels];
    
    return userLevel >= requiredLevel;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <Smartphone className="h-8 w-8 text-sidebar-primary" />
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-semibold text-sidebar-foreground">MobileSales Pro</h2>
            <div className="flex gap-2 flex-wrap">
              <Badge
                className={`${getTierColor(profile?.subscription_tier || 'starter_kit')} text-white text-xs`}
              >
                {profile?.subscription_tier ? profile.subscription_tier.toUpperCase().replace('_', ' ') : 'STARTER KIT'}
              </Badge>
              {role && role !== 'user' && (
                <Badge className={`${getRoleBadgeColor(role)} text-xs`}>
                  {role.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const hasAccess = canAccessFeature(item.tier);
            
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  onClick={() => hasAccess ? navigate(item.path) : navigate('/profile')}
                  className={`${isActive ? 'bg-sidebar-accent' : ''} ${!hasAccess ? 'opacity-50' : ''}`}
                  tooltip={item.title}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  {!hasAccess && (
                    <Crown className="h-3 w-3 ml-auto text-yellow-500 group-data-[collapsible=icon]:hidden" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          
          {isAdmin && (
            <>
              <div className="px-2 py-2 text-xs font-semibold text-muted-foreground group-data-[collapsible=icon]:hidden">
                Admin Panel
              </div>
              {adminMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      className={`${isActive ? 'bg-sidebar-accent' : ''} text-yellow-500`}
                      tooltip={item.title}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate('/profile')} tooltip="Profile">
              <User className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};