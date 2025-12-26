import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const contactInfo = [
  {
    icon: MapPin,
    title: 'Location',
    details: ['123 Muscle Street', 'Fitness City, FC 12345']
  },
  {
    icon: Phone,
    title: 'Phone',
    details: ['+1 (555) 123-4567', '+1 (555) 987-6543']
  },
  {
    icon: Mail,
    title: 'Email',
    details: ['info@ironandneon.com', 'support@ironandneon.com']
  },
  {
    icon: Clock,
    title: 'Hours',
    details: ['Mon-Fri: 5AM - 11PM', 'Sat-Sun: 6AM - 10PM']
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/contact/form`, formData);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition">
      {/* Hero */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <p className="text-red-500 font-mono text-sm uppercase tracking-[0.3em] mb-4">
              // Get In Touch
            </p>
            <h1 className="font-heading text-6xl md:text-7xl text-white mb-6">
              CONTACT<br />
              <span className="text-zinc-500">US</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Have questions about our programs or ready to start your transformation? 
              Reach out and we'll get back to you within 24 hours.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-8">
              <h2 className="font-heading text-3xl text-white mb-6">SEND A MESSAGE</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-zinc-400 text-sm uppercase tracking-wider">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="mt-2 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 rounded-sm focus:border-red-500"
                    data-testid="contact-name"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-zinc-400 text-sm uppercase tracking-wider">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="mt-2 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 rounded-sm focus:border-red-500"
                    data-testid="contact-email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-zinc-400 text-sm uppercase tracking-wider">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="mt-2 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 rounded-sm focus:border-red-500"
                    data-testid="contact-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-zinc-400 text-sm uppercase tracking-wider">
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Tell us about your fitness goals..."
                    rows={5}
                    className="mt-2 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 rounded-sm focus:border-red-500 resize-none"
                    data-testid="contact-message"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-6 rounded-sm uppercase tracking-wider"
                  data-testid="contact-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info & Map */}
            <div className="space-y-8">
              {/* Info Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <div 
                      key={index}
                      className="bg-zinc-900 border border-zinc-800 rounded-sm p-6"
                      data-testid={`contact-info-${index}`}
                    >
                      <div className="w-10 h-10 bg-red-500/10 rounded-sm flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5 text-red-500" />
                      </div>
                      <h3 className="font-heading text-xl text-white mb-2">{info.title}</h3>
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-zinc-500 text-sm">{detail}</p>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Map */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden h-80">
                <iframe
                  title="Gym Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387193.30596698663!2d-74.25986728073741!3d40.69714941680757!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sin!4v1703000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'grayscale(100%) invert(90%) contrast(90%)' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  data-testid="contact-map"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
