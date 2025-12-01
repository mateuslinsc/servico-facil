import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { projectId } from '../utils/supabase/info';
import { ArrowLeft, Heart, Star, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  institutionName: string;
  location: string;
  image?: string;
  rating: number;
  reviewCount?: number;
};

export function FavoritesPage() {
  const navigate = useNavigate();
  const { accessToken } = useContext(AuthContext);
  const [favorites, setFavorites] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/favorites`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (serviceId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/favorites`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ serviceId }),
        }
      );

      if (response.ok) {
        toast.success('Removido dos favoritos');
        fetchFavorites();
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Erro ao remover favorito');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Carregando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl text-gray-900">Meus Favoritos</h1>
              <p className="text-sm text-gray-500">
                {favorites.length} serviço{favorites.length !== 1 ? 's' : ''} favorito{favorites.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center max-w-2xl mx-auto">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl mb-2 text-gray-900">
              Nenhum favorito ainda
            </h3>
            <p className="text-gray-600 mb-6">
              Adicione serviços aos favoritos para acessá-los rapidamente
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Buscar Serviços
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {favorites.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group relative"
              >
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(service.id);
                  }}
                  className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                </button>

                <div
                  onClick={() => navigate(`/service/${service.id}`)}
                  className="cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-200">
                    {service.image ? (
                      <ImageWithFallback
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Heart className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-sm">
                      {service.category}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-xl mb-2 text-gray-900">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {service.description}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                        <span className="text-sm">{service.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({service.reviewCount || 0} avaliações)
                      </span>
                    </div>

                    <div className="text-sm text-gray-500 mb-3">
                      ��� {service.institutionName}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-sm text-indigo-600">Ver detalhes</span>
                      <ChevronRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
