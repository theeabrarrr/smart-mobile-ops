import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Users, 
  BarChart3, 
  Shield, 
  ArrowRight, 
  Package, 
  TrendingUp, 
  FileText,
  Sparkles,
  CheckCircle2,
  Zap,
  Brain,
  Lock,
  Download,
  MessageSquare,
  Star,
  ChevronRight
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">MobileSales Pro</h1>
          </div>
          <Button onClick={handleGetStarted} className="flex items-center gap-2">
            {user ? 'Dashboard' : 'Get Started'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <Badge variant="secondary" className="px-4 py-1.5">
              <Sparkles className="h-3 w-3 mr-1" />
              Smart Business Management for Mobile Shops
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Manage Your Mobile Business Smarter with{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                MobileSales Pro
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Track inventory, sales, profit, and customers — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8">
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToPricing} className="text-lg px-8">
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Value Proposition */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why MobileSales Pro?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              MobileSales Pro helps mobile shop owners in Pakistan save time, avoid manual errors, 
              and grow profits through automation and analytics.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto">
                  <Package className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Manage Inventory Easily</h3>
                <p className="text-sm text-muted-foreground">
                  Track all mobile devices with IMEI, brands, and pricing
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="bg-accent/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-semibold text-lg">Track Sales & Profit in Real Time</h3>
                <p className="text-sm text-muted-foreground">
                  Know your profit margin on every sale instantly
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Organize Customers & Purchases</h3>
                <p className="text-sm text-muted-foreground">
                  Complete customer records with purchase history
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="bg-accent/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto">
                  <BarChart3 className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-semibold text-lg">Get Business Insights Instantly</h3>
                <p className="text-sm text-muted-foreground">
                  Detailed reports and analytics at your fingertips
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in just 3 simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                1
              </div>
              <h3 className="text-xl font-semibold">Add Your Mobiles</h3>
              <p className="text-muted-foreground">
                Enter brand, model, IMEI, price, and supplier details in seconds
              </p>
              <div className="bg-muted/50 p-4 rounded-lg text-sm text-left">
                <code className="text-xs">Brand: Samsung, Model: S23, IMEI: 123456...</code>
              </div>
            </div>
            <div className="text-center space-y-4 animate-fade-in">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-accent">
                2
              </div>
              <h3 className="text-xl font-semibold">Record Sales & Purchases</h3>
              <p className="text-muted-foreground">
                Track all transactions with customer names, CNIC, and payment details
              </p>
              <div className="bg-muted/50 p-4 rounded-lg text-sm text-left">
                <code className="text-xs">Sale: PKR 85,000 | Profit: PKR 5,000</code>
              </div>
            </div>
            <div className="text-center space-y-4 animate-fade-in">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                3
              </div>
              <h3 className="text-xl font-semibold">View Reports & Profit</h3>
              <p className="text-muted-foreground">
                Analyze your shop's performance with detailed reports and dashboards
              </p>
              <div className="bg-muted/50 p-4 rounded-lg text-sm text-left">
                <code className="text-xs">Monthly Profit: PKR 125,000 ↑ 12%</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Pricing Plans</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade as your business grows
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Starter Kit */}
            <Card className="relative border-2 hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="text-2xl">Starter Kit</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Free</span>
                </div>
                <CardDescription className="text-base mt-2">
                  Ideal for small mobile sellers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Basic sales, purchase & inventory management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Limit: 50 mobiles/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Single user access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Simple dashboard</span>
                  </li>
                </ul>
                <Button onClick={handleGetStarted} variant="outline" className="w-full">
                  Start Free
                </Button>
              </CardContent>
            </Card>

            {/* Dealer Pack */}
            <Card className="relative border-2 border-primary shadow-xl scale-105 md:scale-110 z-10">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Dealer Pack</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">PKR 600</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="text-base mt-2">
                  Best for mid-level shop owners
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">All Starter Kit features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Limit: 200 mobiles/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Expense tracker</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Customer history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Multi-user roles (Admin, Staff, Viewer)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Monthly profit-loss summary</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Smart notifications for due payments or low stock</span>
                  </li>
                </ul>
                <Button onClick={handleGetStarted} className="w-full">
                  Start Now
                </Button>
              </CardContent>
            </Card>

            {/* Empire Plan */}
            <Card className="relative border-2 border-accent/50 hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="text-2xl">Empire Plan</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">PKR 1,500</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="text-base mt-2">
                  For wholesalers & chain owners
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Unlimited mobiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Everything in Dealer Pack</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Advanced analytics & visual reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Stock alerts (low inventory)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Custom report exports (CSV/PDF)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Multi-branch support (coming soon)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Priority support (24/7)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Early access to new features</span>
                  </li>
                </ul>
                <Button onClick={handleGetStarted} variant="default" className="w-full bg-accent hover:bg-accent/90">
                  Start Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features for Your Business
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-time Profit Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  See your daily, weekly, and monthly profits at a glance with beautiful charts
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <Package className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Bulk Stock Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Add multiple mobile devices at once with CSV import (Dealer Pack+)
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ask questions in Roman Urdu or English about your business data (Empire Plan)
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <Lock className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Secure Cloud Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Bank-level security with RLS policies and encrypted storage
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Roman Urdu Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Communicate with the AI assistant in your preferred language
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-2">
                  <Download className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>CSV Export & Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Download your data anytime for accounting or backup purposes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="mb-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Empire Plan Feature
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                AI Business Assistant
              </h2>
              <p className="text-lg text-muted-foreground">
                Ask business questions in Roman Urdu or English — get instant insights from your sales data.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg mt-1">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Natural Language Queries</p>
                    <p className="text-sm text-muted-foreground">
                      "Mujhe iss mahine ka total profit batao"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-accent/10 p-2 rounded-lg mt-1">
                    <BarChart3 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Sales Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      "Kis mobile model ki sabse zyada sales hui?"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg mt-1">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Business Insights</p>
                    <p className="text-sm text-muted-foreground">
                      "Which brand gives me the highest profit margin?"
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={handleGetStarted} size="lg" className="bg-accent hover:bg-accent/90">
                Try AI Assistant
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="bg-card border-2 border-border rounded-xl p-6 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-muted w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 flex-1">
                    <p className="text-sm">Mujhe aaj ka total profit batao</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-primary/10 rounded-lg p-3 flex-1">
                    <p className="text-sm">Today's total profit is <span className="font-bold">PKR 12,500</span> from 8 sales. Your best-selling device was Samsung S23 with 3 units sold.</p>
                  </div>
                  <div className="bg-primary w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              <Lock className="h-8 w-8 inline-block mr-2 text-primary" />
              Security & Data Protection
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your business data is protected with enterprise-level security
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Server-side Validation</h3>
                <p className="text-sm text-muted-foreground">All data validated before storage</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">RLS Subscription Protection</h3>
                <p className="text-sm text-muted-foreground">Database-level access control</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <FileText className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Sanitized Error Handling</h3>
                <p className="text-sm text-muted-foreground">No sensitive data in logs</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Secure Cloud Database</h3>
                <p className="text-sm text-muted-foreground">Powered by Supabase</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trusted by Mobile Shop Owners
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm italic">
                  "MobileSales Pro ne meri shop ka kaam bohot asaan kar diya. Ab main asani se profit track kar sakta hoon!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">AK</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Ahmed Khan</p>
                    <p className="text-xs text-muted-foreground">Mobile Shop Owner, Karachi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm italic">
                  "The AI assistant is incredible! I can ask questions in Roman Urdu and get instant answers about my sales."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="font-semibold text-accent">MH</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Muhammad Hasan</p>
                    <p className="text-xs text-muted-foreground">Retailer, Lahore</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm italic">
                  "Reports feature is exactly what I needed. Now I can see which mobiles are most profitable!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">SA</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Sana Ali</p>
                    <p className="text-xs text-muted-foreground">Business Owner, Islamabad</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Start managing your mobile business smarter — try MobileSales Pro free today
          </h2>
          <p className="text-xl opacity-90">
            Join hundreds of mobile shop owners who are already growing their profits
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-background text-foreground hover:bg-background/90 text-lg px-10 py-6 h-auto"
          >
            Create Free Account
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
          <p className="text-sm opacity-75">No credit card required • Start with 20 free mobiles</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <span className="font-bold">MobileSales Pro</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Smart business management for mobile shops in Pakistan
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 MobileSales Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
