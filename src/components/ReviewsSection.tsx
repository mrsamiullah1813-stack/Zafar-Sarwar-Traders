import React, { useState } from 'react';
import { 
  Star, 
  Sparkles, 
  Quote, 
  Plus, 
  X, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';
import { Review } from '../types';

interface ReviewsSectionProps {
  reviews: Review[];
  onAddReview: (review: Review) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, onAddReview }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    role: '',
    location: '',
    projectType: '',
    rating: 5,
    comment: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;

    onAddReview({
      id: `rev-${Date.now()}`,
      name: newReview.name,
      role: newReview.role || 'Valued Client',
      location: newReview.location || 'Local Project',
      projectType: newReview.projectType || 'Sanitary & Material Order',
      rating: newReview.rating,
      comment: newReview.comment,
      date: 'Just Now'
    });

    setModalOpen(false);
    setNewReview({
      name: '',
      role: '',
      location: '',
      projectType: '',
      rating: 5,
      comment: ''
    });
  };

  return (
    <section id="reviews" className="py-20 lg:py-28 bg-[#030712] relative overflow-hidden border-t border-slate-800/80">
      {/* Background Accent */}
      <div className="absolute top-1/2 left-10 w-[500px] h-[500px] bg-gradient-to-tr from-blue-900/15 via-slate-900/10 to-transparent rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3 shadow-xl">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified Client Testimonials</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
              Trusted by <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-sky-300 to-cyan-300">Thousands of Clients</span>
            </h2>
            <p className="mt-2 text-slate-300 text-sm font-light max-w-xl">
              Real reviews from architects, civil contractors, commercial developers, and villa owners across Pakistan.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-950/20"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Leave a Review</span>
          </button>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="relative p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-950/20 flex flex-col justify-between"
            >
              <div>
                {/* Rating Stars & Quote Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-amber-500/30" />
                </div>

                {/* Comment */}
                <p className="text-slate-100 text-sm leading-relaxed font-normal italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                    {rev.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-sm flex items-center gap-1 truncate">
                      <span>{rev.name}</span>
                      <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    </h4>
                    <p className="text-slate-300 text-xs font-normal truncate">{rev.role} • {rev.location}</p>
                  </div>
                </div>

                <span className="shrink-0 text-xs text-amber-300 font-medium bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  {rev.projectType}
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Submit Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white font-serif mb-1">
              Share Your Experience
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Your feedback helps us continuously deliver world-class service.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                  placeholder="e.g. Engr. Usman Ali"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role / Profession</label>
                  <input
                    type="text"
                    value={newReview.role}
                    onChange={(e) => setNewReview({ ...newReview, role: e.target.value })}
                    placeholder="e.g. Architect / Contractor"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={newReview.location}
                    onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
                    placeholder="e.g. DHA Phase 5"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Scope</label>
                <input
                  type="text"
                  value={newReview.projectType}
                  onChange={(e) => setNewReview({ ...newReview, projectType: e.target.value })}
                  placeholder="e.g. 1 Kanal Villa Bathrooms & CPVC Plumbing"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="p-1 text-amber-400 hover:scale-125 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= newReview.rating ? 'fill-amber-400' : 'text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Review *</label>
                <textarea
                  required
                  rows={3}
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Share details about product quality, pricing, and service..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Post Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
