import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AIAssistant() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          <Sparkles className="h-3 w-3 mr-1" />
          Premium Feature
        </Badge>
      </div>

      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-purple-600" />
            Smart Business Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Your AI Assistant analyzes your sales data and provides intelligent insights to help grow your mobile business.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Sales Predictions</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered forecasts for your best-selling models and optimal pricing strategies.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold">Inventory Alerts</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive smart notifications about slow-moving stock and reorder recommendations.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Market Insights</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Stay updated with market trends and competitor analysis for better decision making.
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">Chat Support</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ask questions about your business data and get instant, intelligent responses.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-purple-100 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">Coming Soon in Premium</h3>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>• Personalized business recommendations</li>
                <li>• Automated report generation</li>
                <li>• Advanced analytics and insights</li>
                <li>• 24/7 AI business consultant</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Upgrade to Premium</h3>
          <p className="text-muted-foreground mb-4">
            Unlock powerful AI features to supercharge your mobile business with intelligent insights and automation.
          </p>
          <Badge variant="outline" className="text-purple-600 border-purple-200">
            Available with Premium Plan
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}