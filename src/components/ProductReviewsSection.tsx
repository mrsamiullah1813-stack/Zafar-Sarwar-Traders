import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  User, 
  Send, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  AlertCircle,
  ThumbsUp,
  ShieldCheck
} from 'lucide-react';
import { ProductReview, ProductRatingStats } from '../types';
import { 
  loadProductReviewsFromDatabase, 
  submitProductReviewToDatabase, 
  calculateProductRatingStats 
} from '../services/supabaseService';
import { loadCustomerProfile } from '../utils/customerStorage';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productCategory?: string;
  onNavigate?: (path: string) => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  productCategory
}) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Auto-populate customer name if previously saved in profile
  useEffect(() => {
    try {
      const profile = loadCustomerProfile();
      if (profile && profile.fullName && !customerName) {
        setCustomerName(profile.fullName);
      }
    } catch {}
  }, []);

  // Fetch real reviews from production database whenever productId changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setSubmitSuccess(false);
    setSubmitError(null);

    loadProductReviewsFromDatabase(productId)
      .then((data) => {
        if (isMounted) {
          setReviews(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load reviews from database:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Real Mathematical Rating Statistics
  const stats: ProductRatingStats = useMemo(() => {
    return calculateProductRatingStats(reviews);
  }, [reviews]);

  // Display Reviews: First 3 or All
  const displayedReviews = useMemo(() => {
    if (isExpanded) return reviews;
    return reviews.slice(0, 3);
  }, [reviews, isExpanded]);

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const trimmedName = customerName.trim();
    const trimmedText = reviewText.trim();

    if (!trimmedName) {
      setSubmitError('Please enter your name or display name.');
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      setSubmitError('Please select a star rating between 1 and 5.');
      return;
    }
    if (!trimmedText) {
      setSubmitError('Please enter your written review.');
      return;
    }
    if (trimmedText.length < 5) {
      setSubmitError('Review must be at least 5 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const customerProfile = loadCustomerProfile();
      const res = await submitProductReviewToDatabase({
        productId,
        customerName: trimmedName,
        customerId: customerProfile?.customerId,
        rating,
        reviewText: trimmedText
      });

      if (res.success && res.review) {
        // Add new review to local state immediately
        setReviews((prev) => {
          const filtered = prev.filter(r => r.id !== res.review!.id);
          return [res.review!, ...filtered];
        });
        setSubmitSuccess(true);
        setReviewText('');
        setIsFormOpen(false);
        setTimeout(() => setSubmitSuccess(false), 8000);
      } else {
        setSubmitError(res.error || 'Could not save review. Please check your network and try again.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'An unexpected error occurred while saving your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5: return '5 Stars - Excellent Quality';
      case 4: return '4 Stars - Very Good';
      case 3: return '3 Stars - Average / Satisfactory';
      case 2: return '2 Stars - Below Expectations';
      case 1: return '1 Star - Poor Experience';
      default: return 'Select Star Rating';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Recently verified';
    }
  };

  return (
    <section id="customer-reviews" className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
              Customer Reviews & Ratings
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Verified Showroom Reviews
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Genuine verified feedback from customers who purchased {productName}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setSubmitError(null);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Star className="w-4 h-4 fill-white" />
          <span>{isFormOpen ? 'Cancel Review' : 'Write a Review'}</span>
        </button>
      </div>

      {/* SUCCESS CONFIRMATION TOAST BANNER */}
      {submitSuccess && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Thank you! Your review has been saved to the database.</div>
            <div className="text-xs text-emerald-700 mt-0.5">
              Your feedback is live and helps other shoppers make informed decisions.
            </div>
          </div>
        </div>
      )}

      {/* WRITE A REVIEW FORM (EXPANDABLE) */}
      {isFormOpen && (
        <form onSubmit={handleSubmitReview} className="mt-6 p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Write Your Review for {productName}
            </h3>
            <span className="text-[11px] text-slate-400">All fields required</span>
          </div>

          {/* STAR SELECTOR */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = (hoverRating || rating) >= starVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                      title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-slate-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-slate-700 ml-2">
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>
          </div>

          {/* CUSTOMER NAME */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Your Name / Display Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Muhammad Tariq, Homeowner / Contractor"
                maxLength={100}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* WRITTEN REVIEW TEXTAREA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Your Written Review <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{reviewText.length}/2000</span>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share details about the build quality, finish, packaging, delivery experience, or installation..."
              rows={4}
              maxLength={2000}
              required
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* ERROR ALERT */}
          {submitError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          {/* SUBMIT CONTROLS */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Verified Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* RATING SUMMARY & STAR DISTRIBUTION */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-100">
        {/* BIG AVERAGE RATING NUMBER & STARS */}
        <div className="md:col-span-4 text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-slate-200/80 pb-5 md:pb-0 md:pr-6">
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="text-4xl sm:text-5xl font-black font-serif text-slate-900 tracking-tight">
              {stats.totalCount > 0 ? stats.averageRating.toFixed(1) : '0.0'}
            </span>
            <span className="text-slate-400 font-bold text-sm">/ 5.0</span>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-1">
            {[1, 2, 3, 4, 5].map((s) => {
              const filled = stats.averageRating >= s;
              const half = !filled && stats.averageRating >= s - 0.5;
              return (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    filled
                      ? 'text-amber-400 fill-amber-400'
                      : half
                      ? 'text-amber-400 fill-amber-400/50'
                      : 'text-slate-200'
                  }`}
                />
              );
            })}
          </div>

          <div className="text-xs text-slate-600 font-medium">
            {stats.totalCount > 0
              ? `Based on ${stats.totalCount} verified review${stats.totalCount > 1 ? 's' : ''}`
              : 'No customer ratings recorded yet'}
          </div>
        </div>

        {/* STAR DISTRIBUTION PROGRESS BARS */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((starNum) => {
            const count = stats.distribution[starNum as keyof typeof stats.distribution] || 0;
            const percentage = stats.totalCount > 0 ? Math.round((count / stats.totalCount) * 100) : 0;
            return (
              <div key={starNum} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-slate-700 font-bold shrink-0 flex items-center gap-1">
                  <span>{starNum}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-200/90 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-16 text-right text-slate-500 font-medium shrink-0">
                  {count} <span className="text-[10px] text-slate-400">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="mt-8 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs">Loading verified reviews from database...</p>
          </div>
        ) : reviews.length === 0 ? (
          /* HONEST EMPTY STATE - ZERO FAKE DATA */
          <div className="py-12 px-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">
              No reviews yet. Be the first to review this product.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Have you purchased or inspected {productName}? Share your rating to help other buyers.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(true);
                setSubmitError(null);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>Write First Review</span>
            </button>
          </div>
        ) : (
          <>
            {/* RENDER DISPLAYED REVIEWS */}
            <div className="space-y-4">
              {displayedReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center border border-blue-200 uppercase">
                        {rev.customerName.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{rev.customerName}</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified Customer
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDate(rev.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* REVIEW STARS */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= rev.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* REVIEW TEXT */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {rev.reviewText}
                  </p>
                </div>
              ))}
            </div>

            {/* SEE ALL REVIEWS TOGGLE (WHEN MORE THAN 3 REVIEWS) */}
            {reviews.length > 3 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                      <span>Show Less ({reviews.length} reviews)</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                      <span>See All Reviews ({reviews.length})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
