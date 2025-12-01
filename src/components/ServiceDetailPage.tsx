import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import {
  ArrowLeft,
  Heart,
  Star,
  MapPin,
  Calendar,
  Clock,
  Building
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  institutionId: string;
  institutionName: string;
  location: string;
  image?: string;
  rating: number;
  reviewCount?: number;
};

type Review = {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServiceDetails();
    checkFavorite();
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      const [serviceRes, reviewsRes] = await Promise.all([
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/services/${id}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        ),
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/reviews/${id}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        ),
      ]);

      if (serviceRes.ok) {
        const serviceData = await serviceRes.json();
        setService(serviceData.service);
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews);
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      toast.error('Erro ao carregar detalhes do serviço');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/profile`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const favorites = data.profile?.favorites || [];
        setIsFavorite(favorites.includes(id));
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/favorites`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ serviceId: id }),
        }
      );

      if (response.ok) {
        setIsFavorite(!isFavorite);
        toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            serviceId: id,
            rating,
            comment,
          }),
        }
      );

      if (response.ok) {
        toast.success('Avaliação enviada com sucesso!');
        setShowReviewForm(false);
        setRating(5);
        setComment('');
        fetchServiceDetails();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/appointments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            serviceId: id,
            serviceName: service?.name,
            institutionName: service?.institutionName,
            date: appointmentDate,
            time: appointmentTime,
          }),
        }
      );

      if (response.ok) {
        toast.success('Agendamento realizado com sucesso!');
        setShowAppointmentForm(false);
        setAppointmentDate('');
        setAppointmentTime('');
        navigate('/appointments');
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
      toast.error('Erro ao realizar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Serviço não encontrado</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative h-64 bg-gray-200">
        {service.image ? (
          <ImageWithFallback
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Heart className="w-20 h-20" />
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <Heart
            className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-700'}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Service Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 -mt-12 relative z-10 mb-6">
          <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm mb-3">
            {service.category}
          </div>

          <h1 className="text-3xl mb-3 text-gray-900">{service.name}</h1>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
              <span className="text-lg">{service.rating.toFixed(1)}</span>
              <span className="text-gray-500">
                ({service.reviewCount || 0} avaliações)
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-6">{service.description}</p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-gray-700">
              <Building className="w-5 h-5 text-indigo-600" />
              <span>{service.institutionName}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <span>{service.location}</span>
            </div>
          </div>

          <button
            onClick={() => setShowAppointmentForm(true)}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            Agendar Consulta
          </button>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl text-gray-900">Avaliações</h2>
            {user?.type === 'client' && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Avaliar
              </button>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma avaliação ainda. Seja o primeiro a avaliar!
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl mb-4 text-gray-900">Avaliar Serviço</h3>

            <form onSubmit={submitReview}>
              <div className="mb-4">
                <label className="block text-sm mb-2 text-gray-700">Nota</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm mb-2 text-gray-700">
                  Comentário
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Compartilhe sua experiência..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Form Modal */}
      {showAppointmentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl mb-4 text-gray-900">Agendar Consulta</h3>

            <form onSubmit={submitAppointment}>
              <div className="mb-4">
                <label className="block text-sm mb-2 text-gray-700">
                  Data
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm mb-2 text-gray-700">
                  Horário
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAppointmentForm(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Agendando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
