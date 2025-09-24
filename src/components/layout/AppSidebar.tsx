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
  Crown
} from 'lucide-react';

interface Profile {
  subscription_tier: 'basic' | 'standard' | 'premium';
}

export const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      tier: 'basic'
    },
    {
      title: 'Customers',
      icon: Users,
      path: '/customers',
      tier: 'basic'
    },
    {
      title: 'Mobile Inventory',
      icon: Smartphone,
      path: '/inventory',
      tier: 'basic'
    },
    {
      title: 'Sales',
      icon: ShoppingCart,
      path: '/sales',
      tier: 'basic'
    },
    {
      title: 'Purchases',
      icon: FileText,
      path: '/purchases',
      tier: 'basic'
    },
    {
      title: 'Reports',
      icon: BarChart3,
      path: '/reports',
      tier: 'standard'
    },
    {
      title: 'AI Assistant',
      icon: Bot,
      path: '/ai-assistant',
      tier: 'premium'
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-blue-500';
      case 'standard': return 'bg-green-500';
      case 'premium': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const canAccessFeature = (requiredTier: string) => {
    if (!profile) return requiredTier === 'basic';
    
    const tierLevels = { basic: 1, standard: 2, premium: 3 };
    const userLevel = tierLevels[profile.subscription_tier];
    const requiredLevel = tierLevels[requiredTier as keyof typeof tierLevels];
    
    return userLevel >= requiredLevel;
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <Smartphone className="h-8 w-8 text-sidebar-primary" />
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">MobileSales Pro</h2>
            <Badge 
              className={`${getTierColor(profile?.subscription_tier || 'basic')} text-white text-xs`}
            >
              {profile?.subscription_tier?.toUpperCase() || 'BASIC'}
            </Badge>
          </div>
        </div>
        <SidebarTrigger className="ml-auto" />
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
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                  {!hasAccess && (
                    <Crown className="h-3 w-3 ml-auto text-yellow-500" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate('/profile')}>
              <User className="h-4 w-4" />
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};