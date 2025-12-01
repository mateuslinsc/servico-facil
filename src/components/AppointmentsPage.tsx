import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { projectId } from '../utils/supabase/info';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type Appointment = {
  id: string;
  serviceId: string;
  serviceName: string;
  institutionName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
};

export function AppointmentsPage() {
  const navigate = useNavigate();
  const { accessToken } = useContext(AuthContext);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/appointments`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments.sort((a: Appointment, b: Appointment) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/appointments/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: 'cancelled' }),
        }
      );

      if (response.ok) {
        toast.success('Agendamento cancelado');
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Erro ao cancelar agendamento');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return 'Pendente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return true;
    const aptDate = new Date(apt.date);
    const now = new Date();
    if (filter === 'upcoming') {
      return aptDate >= now && apt.status !== 'cancelled';
    }
    if (filter === 'past') {
      return aptDate < now || apt.status === 'completed' || apt.status === 'cancelled';
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Carregando agendamentos...</p>
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
              <h1 className="text-2xl text-gray-900">Meus Agendamentos</h1>
              <p className="text-sm text-gray-500">
                {appointments.length} agendamento{appointments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'upcoming'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Próximos
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'past'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Passados
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl mb-2 text-gray-900">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Você ainda não tem agendamentos'
                : filter === 'upcoming'
                ? 'Você não tem agendamentos próximos'
                : 'Você não tem agendamentos passados'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Buscar Serviços
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
              const isUpcoming = appointmentDateTime >= new Date() && appointment.status !== 'cancelled';
              const canCancel = isUpcoming && appointment.status === 'pending';

              return (
                <div
                  key={appointment.id}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl mb-1 text-gray-900">
                        {appointment.serviceName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {appointment.institutionName}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      <span className="text-sm">{getStatusText(appointment.status)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <span>
                        {new Date(appointment.date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      <span>{appointment.time}</span>
                    </div>
                  </div>

                  {isUpcoming && appointment.status !== 'cancelled' && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4">
                      <Bell className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        Lembre-se de comparecer no horário marcado
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/service/${appointment.serviceId}`)}
                      className="flex-1 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Ver Serviço
                    </button>
                    {canCancel && (
                      <button
                        onClick={() => {
                          if (confirm('Deseja realmente cancelar este agendamento?')) {
                            cancelAppointment(appointment.id);
                          }
                        }}
                        className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
