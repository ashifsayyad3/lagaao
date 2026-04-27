'use client';

import { useState } from 'react';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function ProductReviews({ productId }: { productId: string }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsApi.getByProduct(productId) as Promise<any>,
    select: (d: any) => d.data,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => reviewsApi.create(productId, data) as Promise<any>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      setRating(0);
      setReviewBody('');
      setShowForm(false);
      toast.success('Review submitted! It will be published after moderation.');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to submit review'),
  });

  const reviews = data?.reviews || [];
  const ratingBreakdown = data?.ratingBreakdown || [];

  const handleSubmit = () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    mutation.mutate({ rating, body: reviewBody });
  };

  return (
    <section id="reviews" className="mt-16 border-t border-gray-100 pt-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="section-title">Customer Reviews ({data?.total || 0})</h2>
        {isAuthenticated && (
          <button onClick={() => setShowForm(!showForm)} className="btn-outline text-sm">
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Rating breakdown */}
      {ratingBreakdown.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingBreakdown.find((r: any) => r.rating === star)?._count?.rating || 0;
              const pct = data?.total ? (count / data.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs w-5 text-right">{star}</span>
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
          <h3 className="font-semibold mb-4">Share your experience</h3>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(s)}
              >
                <Star className={`w-8 h-8 transition-colors ${s <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            placeholder="Tell others about your experience with this plant..."
            rows={4}
            className="w-full input-field resize-none mb-4"
          />
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="btn-primary text-sm"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-5">
        {reviews.map((review: any) => (
          <div key={review.id} className="border-b border-gray-100 pb-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold text-sm">
                    {review.user?.firstName?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{review.user?.firstName} {review.user?.lastName?.[0]}.</p>
                    {review.isVerified && (
                      <div className="flex items-center gap-0.5 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" /> Verified Purchase
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
            {review.title && <p className="font-medium text-gray-900 mb-1">{review.title}</p>}
            <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
            <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No reviews yet. Be the first to review!</p>
          </div>
        )}
      </div>
    </section>
  );
}
