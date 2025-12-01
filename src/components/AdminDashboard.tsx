import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { projectId } from '../utils/supabase/info';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  Calendar,
  Star,
  BarChart3,
  Download,
  FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner@2.0.3';

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  institutionId: string;
  institutionName: string;
  location: string;
  rating: number;
  reviewCount?: number;
};

type Analytics = {
  totalServices: number;
  totalAppointments: number;
  totalReviews: number;
  totalUsers: number;
  servicesByCategory: Record<string, number>;
  monthlyAppointments: Array<{ month: string; count: number }>;
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);
  const [services, setServices] = useState<Service[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Odontologia',
    description: '',
    location: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('AdminDashboard - Fetching data...');
      console.log('AdminDashboard - Current user:', user);
      console.log('AdminDashboard - Access token:', accessToken ? 'exists' : 'missing');
      
      const [servicesRes, analyticsRes] = await Promise.all([
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/services`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ),
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/analytics`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ),
      ]);

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        console.log('AdminDashboard - All services from server:', data.services);
        console.log('AdminDashboard - User institutionId:', user?.institutionId);
        console.log('AdminDashboard - User ID:', user?.id);
        
        // Filter services for current user's institution
        // Use user.id as fallback if institutionId is not set
        const institutionIdToFilter = user?.institutionId || user?.id;
        console.log('AdminDashboard - Filtering by institutionId:', institutionIdToFilter);
        
        const userServices = data.services.filter(
          (s: Service) => {
            console.log(`Service ${s.name} institutionId:`, s.institutionId);
            return s.institutionId === institutionIdToFilter;
          }
        );
        
        console.log('AdminDashboard - Filtered services:', userServices);
        setServices(userServices);
      } else {
        console.error('AdminDashboard - Failed to fetch services:', servicesRes.status);
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingService
        ? `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/services/${editingService.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/services`;

      const method = editingService ? 'PUT' : 'POST';

      // Use user.id as fallback if institutionId is not set
      const institutionIdToSave = user?.institutionId || user?.id || 'default';
      
      console.log('AdminDashboard - Saving service with institutionId:', institutionIdToSave);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          institutionId: institutionIdToSave,
          institutionName: user?.name || 'Instituição',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AdminDashboard - Service saved:', data);
        toast.success(
          editingService ? 'Serviço atualizado com sucesso!' : 'Serviço criado com sucesso!'
        );
        setShowAddForm(false);
        setEditingService(null);
        setFormData({
          name: '',
          category: 'Odontologia',
          description: '',
          location: '',
        });
        fetchData();
      } else {
        const error = await response.json();
        console.error('AdminDashboard - Error saving service:', error);
        toast.error('Erro ao salvar serviço');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Erro ao salvar serviço');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description,
      location: service.location,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este serviço?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/services/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Serviço excluído com sucesso!');
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao excluir serviço');
    }
  };

  const cleanServicesWithoutImages = async () => {
    if (!confirm('Deseja realmente excluir todos os serviços sem imagem? Esta ação não pode ser desfeita.')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/services/clean-no-images`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.deletedCount} serviço(s) excluído(s) com sucesso!`);
        fetchData();
      }
    } catch (error) {
      console.error('Error cleaning services:', error);
      toast.error('Erro ao limpar serviços');
    }
  };

  const exportToCSV = () => {
    if (!analytics) return;

    const csvData = [
      ['ServiçoFácil - Relatório de Análises'],
      [''],
      ['Resumo Geral'],
      ['Total de Serviços', analytics.totalServices],
      ['Total de Agendamentos', analytics.totalAppointments],
      ['Total de Usuários', analytics.totalUsers],
      ['Total de Avaliações', analytics.totalReviews],
      [''],
      ['Agendamentos por Mês'],
      ['Mês', 'Quantidade'],
      ...analytics.monthlyAppointments.map(item => [item.month, item.count]),
      [''],
      ['Serviços por Categoria'],
      ['Categoria', 'Quantidade'],
      ...Object.entries(analytics.servicesByCategory).map(([name, count]) => [name, count]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Relatório exportado com sucesso!');
  };

  const exportToPDF = () => {
    if (!analytics) return;

    // Create a simple HTML for PDF
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Análises</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #4f46e5; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #4f46e5; color: white; }
          .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
          .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .card h3 { margin: 0 0 10px 0; color: #666; }
          .card p { margin: 0; font-size: 32px; font-weight: bold; color: #4f46e5; }
        </style>
      </head>
      <body>
        <h1>ServiçoFácil - Relatório de Análises</h1>
        <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
        
        <div class="summary">
          <div class="card">
            <h3>Total de Serviços</h3>
            <p>${analytics.totalServices}</p>
          </div>
          <div class="card">
            <h3>Total de Agendamentos</h3>
            <p>${analytics.totalAppointments}</p>
          </div>
          <div class="card">
            <h3>Total de Usuários</h3>
            <p>${analytics.totalUsers}</p>
          </div>
          <div class="card">
            <h3>Total de Avaliações</h3>
            <p>${analytics.totalReviews}</p>
          </div>
        </div>

        <h2>Agendamentos por Mês</h2>
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.monthlyAppointments.map(item => `
              <tr>
                <td>${item.month}</td>
                <td>${item.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Serviços por Categoria</h2>
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(analytics.servicesByCategory).map(([name, count]) => `
              <tr>
                <td>${name}</td>
                <td>${count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        toast.success('Relatório preparado para impressão/PDF!');
      }, 250);
    }
  };

  const categories = ['Odontologia', 'Cardiologia', 'Ortopedia', 'Pediatria', 'Psicologia', 'Outros'];

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl text-gray-900">Painel Administrativo</h1>
                <p className="text-sm text-gray-500">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Export buttons */}
              {analytics && (
                <>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Exportar para Excel/CSV"
                  >
                    <Download className="w-5 h-5" />
                    <span className="hidden md:inline">Excel</span>
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Exportar para PDF"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="hidden md:inline">PDF</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setEditingService(null);
                  setFormData({
                    name: '',
                    category: 'Odontologia',
                    description: '',
                    location: '',
                  });
                  setShowAddForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">Novo Serviço</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl mb-1 text-gray-900">{analytics.totalServices}</p>
              <p className="text-sm text-gray-600">Total de Serviços</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-3xl mb-1 text-gray-900">{analytics.totalAppointments}</p>
              <p className="text-sm text-gray-600">Agendamentos</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl mb-1 text-gray-900">{analytics.totalUsers}</p>
              <p className="text-sm text-gray-600">Usuários</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-3xl mb-1 text-gray-900">{analytics.totalReviews}</p>
              <p className="text-sm text-gray-600">Avaliações</p>
            </div>
          </div>
        )}

        {/* Charts */}
        {analytics && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl mb-4 text-gray-900">Agendamentos por Mês</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyAppointments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl mb-4 text-gray-900">Serviços por Categoria</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(analytics.servicesByCategory).map(([name, count]) => ({ name, count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Services List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl mb-6 text-gray-900">Meus Serviços</h2>

          {services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Nenhum serviço cadastrado</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Adicionar Primeiro Serviço
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl text-gray-900">{service.name}</h3>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                          {service.category}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{service.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                          <span>{service.rating.toFixed(1)}</span>
                        </div>
                        <span>({service.reviewCount || 0} avaliações)</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(service)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl mb-6 text-gray-900">
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Nome do Serviço</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Localização</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Rua, número - bairro"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingService(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingService ? 'Atualizar' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}