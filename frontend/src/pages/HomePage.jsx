import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Dumbbell, Users, Clock, Award, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const services = [
  {
    icon: Dumbbell,
    title: 'Strength Training',
    description: 'State-of-the-art equipment for building raw power and muscle mass.'
  },
  {
    icon: Users,
    title: 'Group Classes',
    description: 'High-intensity group sessions led by certified instructors.'
  },
  {
    icon: Clock,
    title: '24/7 Access',
    description: 'Train on your schedule with round-the-clock facility access.'
  },
  {
    icon: Award,
    title: 'Personal Training',
    description: 'One-on-one coaching tailored to your specific goals.'
  }
];

export default function HomePage() {
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, trainersRes] = await Promise.all([
          axios.get(`${API}/plans`),
          axios.get(`${API}/trainers`)
        ]);
        setPlans(plansRes.data.plans.slice(0, 3));
        setTrainers(trainersRes.data.trainers.slice(0, 3));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: 'url(https://images.pexels.com/photos/4119179/pexels-photo-4119179.jpeg)',
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 hero-gradient" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 text-center">
          <div className="animate-fade-in">
            <p className="text-red-500 font-mono text-sm uppercase tracking-[0.3em] mb-6">
              // Forge Your Legacy
            </p>
            <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl text-white mb-6 leading-[0.85]">
              IRON<br />
              <span className="text-red-500">&</span> NEON
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto mb-10">
              Where raw power meets cutting-edge training. Push beyond your limits 
              in our industrial-grade facility designed for serious athletes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/plans">
                <Button 
                  data-testid="hero-join-btn"
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg uppercase tracking-wider rounded-sm"
                >
                  Start Training
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/trainers">
                <Button 
                  data-testid="hero-trainers-btn"
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800 px-8 py-6 text-lg uppercase tracking-wider rounded-sm"
                >
                  Meet Our Trainers
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-zinc-600 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-red-500 font-mono text-sm uppercase tracking-[0.3em] mb-4">
                // What We Offer
              </p>
              <h2 className="font-heading text-5xl md:text-6xl text-white mb-6">
                BUILT FOR<br />
                <span className="text-zinc-500">PERFORMANCE</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8">
                Our facility is designed from the ground up to help you achieve 
                peak performance. From heavy iron to cutting-edge tech, we have 
                everything you need to transform.
              </p>
              <Link to="/plans">
                <Button 
                  data-testid="services-view-plans"
                  variant="outline" 
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-sm uppercase tracking-wider"
                >
                  View All Plans
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <div 
                    key={index}
                    className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm card-hover"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    data-testid={`service-card-${index}`}
                  >
                    <div className="w-12 h-12 bg-red-500/10 rounded-sm flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="font-heading text-xl text-white mb-2">{service.title}</h3>
                    <p className="text-zinc-500 text-sm">{service.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trainers */}
      {trainers.length > 0 && (
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <p className="text-red-500 font-mono text-sm uppercase tracking-[0.3em] mb-4">
                // Expert Guidance
              </p>
              <h2 className="font-heading text-5xl md:text-6xl text-white">
                MEET THE<br />
                <span className="text-zinc-500">TEAM</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {trainers.map((trainer, index) => (
                <div 
                  key={trainer.id}
                  className="group relative overflow-hidden rounded-sm bg-zinc-900 border border-zinc-800 card-hover"
                  data-testid={`trainer-preview-${index}`}
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img 
                      src={trainer.image_url} 
                      alt={trainer.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-red-500 font-mono text-xs uppercase tracking-widest mb-1">
                      {trainer.specialty}
                    </p>
                    <h3 className="font-heading text-2xl text-white">{trainer.name}</h3>
                    <p className="text-zinc-500 text-sm">{trainer.experience_years}+ years experience</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/trainers">
                <Button 
                  data-testid="view-all-trainers"
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800 rounded-sm uppercase tracking-wider"
                >
                  View All Trainers
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Preview */}
      {plans.length > 0 && (
        <section className="py-24 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <p className="text-red-500 font-mono text-sm uppercase tracking-[0.3em] mb-4">
                // Investment
              </p>
              <h2 className="font-heading text-5xl md:text-6xl text-white">
                CHOOSE YOUR<br />
                <span className="text-zinc-500">PATH</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <div 
                  key={plan.id}
                  className={`relative bg-zinc-900 border rounded-sm p-8 card-hover ${
                    plan.popular ? 'border-red-500' : 'border-zinc-800'
                  }`}
                  data-testid={`plan-preview-${index}`}
                >
                  {plan.popular && (
                    <div className="popular-badge rounded-sm">Most Popular</div>
                  )}
                  <div className="mb-8">
                    <h3 className="font-heading text-3xl text-white mb-2">{plan.name}</h3>
                    <p className="text-zinc-500 text-sm">{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</p>
                  </div>
                  <div className="mb-8">
                    <span className="font-heading text-5xl text-white">₹{plan.price.toLocaleString()}</span>
                    <span className="text-zinc-500 text-sm ml-2">/ {plan.duration_months === 1 ? 'month' : `${plan.duration_months} months`}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.benefits.slice(0, 4).map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-400 text-sm">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Link to="/plans">
                    <Button 
                      className={`w-full rounded-sm uppercase tracking-wider ${
                        plan.popular 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div>
              <h2 className="font-heading text-5xl md:text-6xl text-white mb-4">
                READY TO<br />
                <span className="text-red-500">TRANSFORM?</span>
              </h2>
              <p className="text-zinc-400 text-lg max-w-lg">
                Join the community of dedicated athletes who have chosen to push 
                beyond their limits. Your journey starts now.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/plans">
                <Button 
                  data-testid="cta-join-btn"
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg uppercase tracking-wider rounded-sm"
                >
                  Join Iron & Neon
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  data-testid="cta-contact-btn"
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800 px-8 py-6 text-lg uppercase tracking-wider rounded-sm"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
