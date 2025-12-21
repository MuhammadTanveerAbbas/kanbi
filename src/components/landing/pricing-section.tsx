'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Basic Kanban board',
      'Manual task creation',
      'Local data storage',
      'Export/Import',
      'Unlimited tasks',
      'No signup required'
    ],
    cta: 'Start Free Now',
    popular: false,
    icon: <Check className="h-5 w-5" />,
    value: 'Everything you need to get organized'
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'For power users who want AI assistance',
    features: [
      'Everything in Free',
      'AI task extraction from notes',
      'Smart deadline detection',
      'Priority identification',
      'Advanced export formats',
      'Email support',
      'Team sharing features'
    ],
    cta: 'Start 7-Day Free Trial',
    popular: true,
    icon: <Sparkles className="h-5 w-5" />,
    value: 'Save hours with AI automation'
  }
];

export default function PricingSection() {
  return (
    <section className="w-full py-12 sm:py-24 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Pay for What You Actually Use
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Start free. Upgrade when AI saves you hours every week.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-primary shadow-xl scale-105 bg-primary/5' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-2 rounded-lg ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                <div className="mb-3">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                <p className="text-xs font-medium text-primary">{plan.value}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Value Justification */}
        <div className="mt-16 text-center space-y-8">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-6">Honest Pricing</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">Free</div>
                <p className="text-sm text-muted-foreground">Full features forever</p>
                <p className="text-xs text-muted-foreground">No hidden costs</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">$9</div>
                <p className="text-sm text-muted-foreground">Monthly for AI features</p>
                <p className="text-xs text-muted-foreground">Cancel anytime</p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-8">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Fair pricing promise:</strong> We only charge for AI features that might save you time.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <span>✓ No hidden fees</span>
              <span>✓ Cancel anytime</span>
              <span>✓ Data export included</span>
              <span>✓ No user limits on Free plan</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}