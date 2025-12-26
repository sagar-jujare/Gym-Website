import React, { useEffect, useState } from 'react';
import { Loader2, Award } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const response = await axios.get(`${API}/trainers`);
        setTrainers(response.data.trainers);
      } catch (error) {
        console.error('Error fetching trainers:', error);
        toast.error('Failed to load trainers');
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

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
              // Expert Guidance
            </p>
            <h1 className="font-heading text-6xl md:text-7xl text-white mb-6">
              MEET YOUR<br />
              <span className="text-zinc-500">COACHES</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Our certified trainers bring years of experience and passion to help 
              you achieve your fitness goals. Each coach specializes in different 
              training methodologies.
            </p>
          </div>

          {/* Trainers Grid */}
          <div className="grid md:grid-cols-2 gap-10">
            {trainers.map((trainer, index) => (
              <div 
                key={trainer.id}
                className="group bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden card-hover"
                data-testid={`trainer-card-${index}`}
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  <div className="lg:w-2/5 aspect-[4/5] lg:aspect-auto overflow-hidden">
                    <img 
                      src={trainer.image_url} 
                      alt={trainer.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Content */}
                  <div className="lg:w-3/5 p-8 flex flex-col justify-center">
                    <p className="text-red-500 font-mono text-xs uppercase tracking-widest mb-2">
                      {trainer.specialty}
                    </p>
                    <h3 className="font-heading text-4xl text-white mb-2">{trainer.name}</h3>
                    <p className="text-zinc-500 text-sm mb-4">
                      {trainer.experience_years}+ years of experience
                    </p>
                    <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                      {trainer.bio}
                    </p>

                    {/* Certifications */}
                    {trainer.certifications && trainer.certifications.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-zinc-600 mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Certifications
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {trainer.certifications.map((cert, i) => (
                            <span 
                              key={i}
                              className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-sm text-xs text-zinc-400"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Join CTA */}
          <div className="mt-24 text-center bg-zinc-900 border border-zinc-800 rounded-sm p-12">
            <h2 className="font-heading text-4xl text-white mb-4">
              TRAIN WITH THE BEST
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
              Personal training sessions are available with all our coaches. 
              Select a membership plan that includes personal training to get started.
            </p>
            <a 
              href="/plans"
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-sm uppercase tracking-wider text-sm font-medium transition-colors"
              data-testid="trainer-cta"
            >
              View Membership Plans
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
