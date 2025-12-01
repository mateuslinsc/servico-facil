import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ArrowLeft, MapPin, Navigation, Building, Star, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

type Service = {
  id: string;
  name: string;
  category: string;
  institutionId: string;
  institutionName: string;
  location: string;
  image?: string;
  rating: number;
  reviewCount?: number;
};

type InstitutionGroup = {
  name: string;
  location: string;
  services: Service[];
};

export function MapPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionGroup[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
    getUserLocation();
  }, []);

  useEffect(() => {
    groupServicesByInstitution();
  }, [services]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Error getting user location:', error);
        }
      );
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/services`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupServicesByInstitution = () => {
    const institutionMap = new Map<string, InstitutionGroup>();
    
    services.forEach((service) => {
      const key = service.institutionId;
      if (!institutionMap.has(key)) {
        institutionMap.set(key, {
          name: service.institutionName,
          location: service.location,
          services: [],
        });
      }
      institutionMap.get(key)!.services.push(service);
    });

    setInstitutions(Array.from(institutionMap.values()));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Carregando mapa...</p>
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
            <div className="flex-1">
              <h1 className="text-2xl text-gray-900">Mapa de Serviços</h1>
              <p className="text-sm text-gray-500">
                {institutions.length} instituição{institutions.length !== 1 ? 'ões' : ''} disponível{institutions.length !== 1 ? 'is' : ''}
              </p>
            </div>
            {userLocation && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <Navigation className="w-4 h-4" />
                <span>Localização ativa</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map View - Visual representation */}
      <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl text-gray-900">Instituições Próximas</h2>
                <p className="text-sm text-gray-600">Clique para ver os serviços disponíveis</p>
              </div>
            </div>

            {/* Visual Map Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {institutions.map((institution, index) => (
                <div
                  key={index}
                  className="relative"
                >
                  <div className="absolute -top-2 -left-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm z-10 shadow-lg">
                    {index + 1}
                  </div>
                  <button
                    onClick={() => 
                      setSelectedInstitution(
                        selectedInstitution === institution.name ? null : institution.name
                      )
                    }
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedInstitution === institution.name
                        ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className={`w-5 h-5 mt-1 flex-shrink-0 ${
                        selectedInstitution === institution.name
                          ? 'text-indigo-600'
                          : 'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">
                          {institution.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {institution.location}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            {institution.services.length} serviço{institution.services.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="container mx-auto px-4 py-6">
        {selectedInstitution ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900">
                Serviços - {selectedInstitution}
              </h2>
              <button
                onClick={() => setSelectedInstitution(null)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Ver todas instituições
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {institutions
                .find((i) => i.name === selectedInstitution)
                ?.services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => navigate(`/service/${service.id}`)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                  >
                    <div className="relative h-40 overflow-hidden bg-gray-200">
                      {service.image ? (
                        <ImageWithFallback
                          src={service.image}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Building className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm">
                        {service.category}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg mb-2 text-gray-900">{service.name}</h3>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                          <span className="text-sm">{service.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ({service.reviewCount || 0})
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-sm text-indigo-600">Ver detalhes</span>
                        <ChevronRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl mb-6 text-gray-900">
              Todos os Serviços por Localização
            </h2>

            <div className="space-y-8">
              {institutions.map((institution, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xl mb-1 text-gray-900">
                          {institution.name}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{institution.location}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedInstitution(institution.name)}
                      className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Ver serviços
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {institution.services.slice(0, 3).map((service) => (
                      <button
                        key={service.id}
                        onClick={() => navigate(`/service/${service.id}`)}
                        className="text-left p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-900 font-medium truncate">
                            {service.name}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                          <span className="text-xs text-gray-600">
                            {service.rating.toFixed(1)}
                          </span>
                        </div>
                      </button>
                    ))}
                    {institution.services.length > 3 && (
                      <button
                        onClick={() => setSelectedInstitution(institution.name)}
                        className="p-3 border border-dashed border-gray-300 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-center text-sm text-gray-600 hover:text-indigo-600"
                      >
                        +{institution.services.length - 3} mais
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}