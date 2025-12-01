import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, Star, Map, Bell, Users } from 'lucide-react';

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <span className="text-xl font-semibold text-gray-800">ServiçoFácil</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Entrar
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl mb-6 text-gray-900">
            Agendamento de Serviços Públicos Simplificado
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Encontre, agende e avalie serviços públicos de saúde e assistência social
            de forma rápida e fácil.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
          >
            Começar Agora
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl mb-3 text-gray-900">Agendamento Online</h3>
            <p className="text-gray-600">
              Agende consultas e serviços de forma rápida e sem filas
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Map className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl mb-3 text-gray-900">Localização</h3>
            <p className="text-gray-600">
              Encontre serviços próximos a você com mapa interativo
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-7 h-7 text-pink-600" />
            </div>
            <h3 className="text-xl mb-3 text-gray-900">Avaliações</h3>
            <p className="text-gray-600">
              Avalie serviços e veja opiniões de outros usuários
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl mb-3 text-gray-900">Notificações</h3>
            <p className="text-gray-600">
              Receba lembretes de consultas e atualizações
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl mb-3 text-gray-900">Favoritos</h3>
            <p className="text-gray-600">
              Salve seus serviços preferidos para acesso rápido
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl mb-3 text-gray-900">Para Instituições</h3>
            <p className="text-gray-600">
              Gerencie serviços e acesse relatórios completos
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16 mt-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl text-white mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Crie sua conta gratuitamente e acesse todos os serviços
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-white text-indigo-600 rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
          >
            Criar Conta Grátis
          </button>
        </div>
      </div>
    </div>
  );
}
