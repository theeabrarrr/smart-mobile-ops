import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Smartphone, Users, BarChart3, Shield, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">MobileSales Pro</h1>
          </div>
          <Button onClick={handleGetStarted} className="flex items-center gap-2">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Complete Mobile Sales & Purchase Management System
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Streamline your mobile business operations with our comprehensive SaaS platform. 
            Manage customers, inventory, sales, and get AI-powered insights.
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="text-lg px-8 py-3"
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">
            Everything you need to manage your mobile business
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Customer Management</h4>
              <p className="text-muted-foreground">
                Keep track of all your customers with detailed contact information and purchase history.
              </p>
            </div>
            <div className="text-center p-6">
              <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Inventory Tracking</h4>
              <p className="text-muted-foreground">
                Manage your mobile device inventory with IMEI tracking, condition monitoring, and pricing.
              </p>
            </div>
            <div className="text-center p-6">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Sales Analytics</h4>
              <p className="text-muted-foreground">
                Get detailed reports and AI-powered insights to optimize your business performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">
            Choose Your Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg p-6">
              <h4 className="text-xl font-semibold mb-2">Basic</h4>
              <p className="text-muted-foreground mb-4">Perfect for small businesses</p>
              <ul className="space-y-2 text-sm">
                <li>✓ Customer management</li>
                <li>✓ Mobile inventory</li>
                <li>✓ Sales & purchase records</li>
              </ul>
            </div>
            <div className="border border-border rounded-lg p-6 bg-primary/5">
              <h4 className="text-xl font-semibold mb-2">Standard</h4>
              <p className="text-muted-foreground mb-4">Most popular choice</p>
              <ul className="space-y-2 text-sm">
                <li>✓ Everything in Basic</li>
                <li>✓ Invoice generation</li>
                <li>✓ Monthly reports</li>
                <li>✓ Advanced analytics</li>
              </ul>
            </div>
            <div className="border border-border rounded-lg p-6">
              <h4 className="text-xl font-semibold mb-2">Premium</h4>
              <p className="text-muted-foreground mb-4">For growing businesses</p>
              <ul className="space-y-2 text-sm">
                <li>✓ Everything in Standard</li>
                <li>✓ AI assistant</li>
                <li>✓ Predictive analytics</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 MobileSales Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
