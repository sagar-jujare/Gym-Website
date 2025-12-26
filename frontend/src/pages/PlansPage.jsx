import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get(`${API}/plans`);
        setPlans(response.data.plans);
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Failed to load membership plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleJoinPlan = (plan) => {
    // For now, redirect to contact page
    // In production, this would initiate a registration flow
    toast.info(`To join the ${plan.name} plan, please contact us or visit our gym!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-transition">
      {/* Hero */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <p className="text-red-500 font-mono text-sm uppercase tracking-[0.3em] mb-4">
              // Membership Plans
            </p>
            <h1 className="font-heading text-6xl md:text-7xl text-white mb-6">
              INVEST IN<br />
              <span className="text-zinc-500">YOURSELF</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Choose the plan that fits your commitment level. All plans include 
              full access to our state-of-the-art facility.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={plan.id}
                className={`relative bg-zinc-900 border rounded-sm overflow-hidden card-hover ${
                  plan.popular ? 'border-red-500 scale-105 z-10' : 'border-zinc-800'
                }`}
                data-testid={`plan-card-${index}`}
              >
                {plan.popular && (
                  <div className="bg-red-500 text-white text-center py-2 text-xs uppercase tracking-widest font-semibold">
                    Most Popular
                  </div>
                )}
                
                <div className="p-8">
                  <div className="mb-8">
                    <h3 className="font-heading text-3xl text-white mb-2">{plan.name}</h3>
                    <p className="text-zinc-500 text-sm">
                      {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''} membership
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-zinc-500 text-2xl">₹</span>
                      <span className="font-heading text-6xl text-white">{plan.price.toLocaleString()}</span>
                    </div>
                    <p className="text-zinc-500 text-sm mt-1">
                      ₹{Math.round(plan.price / plan.duration_months).toLocaleString()} / month
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 w-5 h-5 bg-red-500/10 rounded-sm flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-red-500" />
                        </div>
                        <span className="text-zinc-400 text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={() => handleJoinPlan(plan)}
                    data-testid={`plan-join-${index}`}
                    className={`w-full py-6 rounded-sm uppercase tracking-wider text-sm ${
                      plan.popular 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-24 max-w-3xl mx-auto">
            <h2 className="font-heading text-4xl text-white text-center mb-12">
              FREQUENTLY<br />
              <span className="text-zinc-500">ASKED</span>
            </h2>

            <div className="space-y-6">
              {[
                {
                  q: 'Can I upgrade my plan later?',
                  a: 'Yes, you can upgrade your membership at any time. The price difference will be prorated based on your remaining membership period.'
                },
                {
                  q: 'Is there a joining fee?',
                  a: 'No joining fees! The price you see is the price you pay. We believe in transparent pricing.'
                },
                {
                  q: 'Can I freeze my membership?',
                  a: 'Yes, you can freeze your membership for up to 30 days per year for medical or travel reasons.'
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit/debit cards, UPI, net banking, and cash payments at our facility.'
                }
              ].map((faq, index) => (
                <div 
                  key={index}
                  className="bg-zinc-900 border border-zinc-800 rounded-sm p-6"
                  data-testid={`faq-${index}`}
                >
                  <h3 className="font-heading text-xl text-white mb-2">{faq.q}</h3>
                  <p className="text-zinc-500 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
