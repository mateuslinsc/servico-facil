// Importações principais do React e hooks necessários
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Importação de todos os ícones do Lucide React
import {
  Heart,
  Calendar,
  Map,
  Search,
  LogOut,
  Bell,
  Star,
  ChevronRight,
  LayoutDashboard,
  User,
  Edit,
  Trash2,
  Plus,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

// Componente de imagem com fallback para erros
import { ImageWithFallback } from './figma/ImageWithFallback';

// Biblioteca de notificações toast
import { toast } from 'sonner@2.0.3';

// Tipo TypeScript para definir a estrutura de um Serviço
type Service = {
  id: string;                    // ID único do serviço
  name: string;                  // Nome do serviço
  category: string;              // Categoria (Odontologia, Cardiologia, etc)
  description: string;           // Descrição detalhada
  institutionId: string;         // ID da instituição dona do serviço
  institutionName: string;       // Nome da instituição
  location: string;              // Localização/endereço
  image?: string;                // URL da imagem (opcional)
  rating: number;                // Avaliação média (0-5)
  reviewCount?: number;          // Número de avaliações
};

// Componente principal da página de Dashboard
export function DashboardPage() {
  // Hook de navegação do React Router
  const navigate = useNavigate();

  // Contexto de autenticação com dados do usuário e token
  const { user, logout, accessToken } = useContext(AuthContext);

  // === ESTADOS DO COMPONENTE ===
  
  // Array com todos os serviços carregados do servidor
  const [services, setServices] = useState<Service[]>([]);
  
  // Array com serviços filtrados por busca e categoria
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  
  // Termo de busca digitado pelo usuário
  const [searchTerm, setSearchTerm] = useState('');
  
  // Categoria selecionada ('all' ou nome da categoria)
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Estado de carregamento inicial
  const [loading, setLoading] = useState(true);
  
  // Contador de notificações não lidas (mock)
  const [notifications, setNotifications] = useState(3);
  
  // Controla se o modal de adicionar/editar serviço está aberto
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Armazena o serviço sendo editado (null se estiver criando novo)
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Estado de carregamento durante busca de imagem no Unsplash
  const [loadingImage, setLoadingImage] = useState(false);
  
  // Query de busca para imagens (não usado atualmente)
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  
  // Dados do formulário de criar/editar serviço
  const [formData, setFormData] = useState({
    name: '',
    category: 'Odontologia',
    description: '',
    location: '',
    image: '',
  });

  // === CATEGORIAS DE SERVIÇOS ===
  // Array com todas as categorias disponíveis no sistema
  const categories = [
    { id: 'all', name: 'Todos', icon: '🏥' },
    { id: 'Odontologia', name: 'Odontologia', icon: '🦷' },
    { id: 'Cardiologia', name: 'Cardiologia', icon: '❤️' },
    { id: 'Ortopedia', name: 'Ortopedia', icon: '🦴' },
    { id: 'Pediatria', name: 'Pediatria', icon: '👶' },
    { id: 'Psicologia', name: 'Psicologia', icon: '🧠' },
  ];

  // === EFFECTS ===
  
  // Effect que roda uma vez ao montar o componente - busca serviços
  useEffect(() => {
    fetchServices();
  }, []);

  // Effect que roda sempre que serviços, busca ou categoria mudam
  // Aplica os filtros e atualiza a lista de serviços filtrados
  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory]);

  // === FUNÇÕES DE API ===
  
  /**
   * Busca todos os serviços do servidor
   * Faz requisição GET para a API e atualiza o estado
   */
  const fetchServices = async () => {
    try {
      // Faz requisição para endpoint de serviços
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/services`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      // Se a resposta for bem sucedida, atualiza estado
      if (response.ok) {
        const data = await response.json();
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      // Remove o loading independente de sucesso ou erro
      setLoading(false);
    }
  };

  /**
   * Filtra os serviços baseado na categoria e termo de busca
   * Atualiza o estado filteredServices
   */
  const filterServices = () => {
    // Começa com todos os serviços
    let filtered = services;

    // Não filtra mais os serviços da própria instituição
    // Todos os serviços devem aparecer em "Serviços Disponíveis"

    // Filtro por categoria (se não for 'all')
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    // Filtro por termo de busca (busca em nome, descrição e categoria)
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Atualiza estado com serviços filtrados
    setFilteredServices(filtered);
  };

  // === HANDLERS DE AÇÕES ===
  
  /**
   * Faz logout do usuário e redireciona para home
   */
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  /**
   * Abre modal de edição com dados do serviço selecionado
   * @param service - Serviço a ser editado
   * @param e - Evento do mouse (previne propagação)
   */
  const handleEdit = (service: Service, e: React.MouseEvent) => {
    // Previne que o clique abra a página de detalhes
    e.stopPropagation();
    
    // Define o serviço sendo editado
    setEditingService(service);
    
    // Preenche o formulário com dados do serviço
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description,
      location: service.location,
      image: service.image || '',
    });
    
    // Abre o modal
    setShowAddForm(true);
  };

  /**
   * Deleta um serviço após confirmação
   * @param id - ID do serviço a ser deletado
   * @param e - Evento do mouse (previne propagação)
   */
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    // Previne que o clique abra a página de detalhes
    e.stopPropagation();
    
    // Confirmação antes de deletar
    if (!confirm('Deseja realmente excluir este serviço?')) return;

    try {
      // Faz requisição DELETE para a API
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/services/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Se sucesso, mostra mensagem e recarrega serviços
      if (response.ok) {
        toast.success('Serviço excluído com sucesso!');
        fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao excluir serviço');
    }
  };

  /**
   * Submete o formulário de criar/editar serviço
   * @param e - Evento do formulário
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // Previne reload da página
    e.preventDefault();

    try {
      // Define URL e método baseado se está editando ou criando
      const url = editingService
        ? `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/services/${editingService.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/services`;

      const method = editingService ? 'PUT' : 'POST';

      // Faz requisição para criar ou atualizar serviço
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          // Adiciona dados da instituição
          institutionId: user?.institutionId || 'default',
          institutionName: user?.name || 'Instituição',
        }),
      });

      // Se sucesso, fecha modal, reseta form e recarrega serviços
      if (response.ok) {
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
          image: '',
        });
        fetchServices();
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Erro ao salvar serviço');
    }
  };

  // === COMPUTED VALUES ===
  
  /**
   * Filtra serviços da própria instituição para mostrar em "Meus Serviços"
   * Apenas para usuários do tipo 'institution'
   */
  const myServices = user?.type === 'institution'
    ? services.filter(s => {
        const institutionIdToFilter = user.institutionId || user.id;
        return s.institutionId === institutionIdToFilter;
      })
    : [];

  // === DEBUG LOGS ===
  
  /**
   * Effect para debug - mostra no console dados da instituição e serviços
   * Apenas roda para usuários do tipo 'institution'
   */
  useEffect(() => {
    if (user?.type === 'institution') {
      console.log('DashboardPage - User:', user);
      console.log('DashboardPage - institutionId to filter:', user.institutionId || user.id);
      console.log('DashboardPage - All services:', services);
      console.log('DashboardPage - My services:', myServices);
    }
  }, [services, user]);

  // === LOADING STATE ===
  
  /**
   * Renderiza tela de loading enquanto busca serviços
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {/* Spinner animado */}
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  // === RENDER PRINCIPAL ===
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* === HEADER === */}
      {/* Header fixo no topo com logo, nome do usuário e ações */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo e saudação */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-xl text-gray-900">ServiçoFácil</h1>
                <p className="text-sm text-gray-500">Olá, {user?.name}</p>
              </div>
            </div>

            {/* Botões de ação: Notificações e Logout */}
            <div className="flex items-center gap-2">
              {/* Botão de notificações com badge */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
                {/* Badge vermelho se houver notificações */}
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Botão de logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === QUICK ACTIONS === */}
      {/* Seção roxa com ações rápidas (agendamentos, favoritos, mapa, etc) */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Botão de Agendamentos */}
            <button
              onClick={() => navigate('/appointments')}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all text-center"
            >
              <Calendar className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm">Agendamentos</span>
            </button>

            {/* Botão de Favoritos */}
            <button
              onClick={() => navigate('/favorites')}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all text-center"
            >
              <Heart className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm">Favoritos</span>
            </button>

            {/* Botão de Mapa */}
            <button
              onClick={() => navigate('/map')}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all text-center"
            >
              <Map className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm">Mapa</span>
            </button>

            {/* Botão de Painel Admin - apenas para instituições */}
            {user?.type === 'institution' && (
              <button
                onClick={() => navigate('/admin')}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all text-center"
              >
                <LayoutDashboard className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm">Painel Admin</span>
              </button>
            )}

            {/* Botão de Perfil - apenas para clientes */}
            {user?.type === 'client' && (
              <button className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all text-center">
                <User className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm">Perfil</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* === SEARCH BAR === */}
      {/* Barra de busca flutuante sobre a seção roxa */}
      <div className="container mx-auto px-4 -mt-6 relative z-5">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="relative">
            {/* Ícone de busca */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            {/* Input de busca */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar serviços..."
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* === CATEGORIES === */}
      {/* Filtro de categorias em formato de pills horizontais */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="text-sm">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* === MY SERVICES SECTION === */}
      {/* Seção exclusiva para instituições - mostra serviços próprios com opções de editar/excluir */}
      {user?.type === 'institution' && myServices.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Header da seção com botão de novo serviço */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl text-gray-900">Meus Serviços</h2>
              {/* Botão para criar novo serviço */}
              <button
                onClick={() => {
                  setEditingService(null);
                  setFormData({
                    name: '',
                    category: 'Odontologia',
                    description: '',
                    location: '',
                    image: '',
                  });
                  setShowAddForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Novo Serviço</span>
              </button>
            </div>
            
            {/* Lista de serviços da instituição */}
            <div className="space-y-3">
              {myServices.map((service) => (
                <div
                  key={service.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Informações do serviço - clicável para ver detalhes */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/service/${service.id}`)}
                    >
                      {/* Nome e categoria */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl text-gray-900">{service.name}</h3>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                          {service.category}
                        </span>
                      </div>
                      
                      {/* Descrição */}
                      <p className="text-gray-600 mb-2 text-sm">{service.description}</p>
                      
                      {/* Rating e reviews */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                          <span>{service.rating.toFixed(1)}</span>
                        </div>
                        <span>({service.reviewCount || 0} avaliações)</span>
                      </div>
                    </div>
                    
                    {/* Botões de ação: Editar e Excluir */}
                    <div className="flex gap-2">
                      {/* Botão de editar */}
                      <button
                        onClick={(e) => handleEdit(service, e)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar serviço"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      
                      {/* Botão de excluir */}
                      <button
                        onClick={(e) => handleDelete(service.id, e)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir serviço"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === SERVICES GRID === */}
      {/* Grid com todos os serviços disponíveis (filtrados) */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl mb-4 text-gray-900">
          Serviços Disponíveis
        </h2>

        {/* Mensagem se não houver serviços */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">Nenhum serviço encontrado</p>
          </div>
        ) : (
          // Grid responsivo de serviços
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(`/service/${service.id}`)}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
              >
                {/* Imagem do serviço ou placeholder */}
                {service.image ? (
                  // Se tem imagem, mostra a imagem
                  <div className="relative h-48 overflow-hidden bg-gray-200">
                    <ImageWithFallback
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Badge da categoria sobre a imagem */}
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm">
                      {service.category}
                    </div>
                  </div>
                ) : (
                  // Se não tem imagem, mostra placeholder com gradiente
                  <div className="relative h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-indigo-300" />
                    {/* Badge da categoria sobre o placeholder */}
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm">
                      {service.category}
                    </div>
                  </div>
                )}

                {/* Conteúdo do card */}
                <div className="p-4">
                  {/* Nome do serviço */}
                  <h3 className="text-xl mb-2 text-gray-900">{service.name}</h3>
                  
                  {/* Descrição limitada a 2 linhas */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {service.description}
                  </p>

                  {/* Rating e número de avaliações */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                      <span className="text-sm">{service.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({service.reviewCount || 0} avaliações)
                    </span>
                  </div>

                  {/* Nome da instituição */}
                  <div className="text-sm text-gray-500 mb-3">
                    📍 {service.institutionName}
                  </div>

                  {/* Footer do card com call to action */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-indigo-600">Ver detalhes</span>
                    <ChevronRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === ADD/EDIT SERVICE MODAL === */}
      {/* Modal para criar ou editar serviço - apenas aparece se showAddForm === true */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Título do modal (muda se está editando ou criando) */}
            <h3 className="text-2xl mb-6 text-gray-900">
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo: Nome do Serviço */}
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

              {/* Campo: Categoria */}
              <div>
                <label className="block text-sm mb-2 text-gray-700">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {/* Mapeia categorias (exceto 'all') */}
                  {categories.filter(c => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo: Descrição */}
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

              {/* Campo: Localização */}
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

              {/* Campo: Imagem (URL ou busca automática) */}
              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Imagem do Serviço (URL)
                </label>
                <div className="space-y-3">
                  {/* Input manual de URL */}
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />

                  {/* Divisor "ou" */}
                  <div className="text-center">
                    <span className="text-xs text-gray-500">ou</span>
                  </div>

                  {/* Botão de busca automática via Unsplash */}
                  <button
                    type="button"
                    onClick={async () => {
                      setLoadingImage(true);
                      try {
                        // Cria query de busca baseada no nome e categoria
                        const query = `${formData.name || formData.category} medical health clinic`;
                        
                        // Busca imagem no Unsplash
                        const response = await fetch(
                          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=lK0UG3G8vLHMAwKv5P2LQ-xXNd2pLDzW5pzo7x2kDKU&per_page=1`
                        );
                        const data = await response.json();
                        
                        // Se encontrou imagem, atualiza o formulário
                        if (data.results && data.results[0]) {
                          const imageUrl = data.results[0].urls.regular;
                          setFormData({ ...formData, image: imageUrl });
                          toast.success('Imagem carregada com sucesso!');
                        } else {
                          toast.error('Nenhuma imagem encontrada');
                        }
                      } catch (error) {
                        console.error('Error fetching image:', error);
                        toast.error('Erro ao buscar imagem');
                      } finally {
                        setLoadingImage(false);
                      }
                    }}
                    disabled={loadingImage}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingImage ? (
                      <>
                        {/* Spinner de loading */}
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Buscando imagem...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Buscar Imagem Automaticamente</span>
                      </>
                    )}
                  </button>

                  {/* Preview da imagem selecionada */}
                  {formData.image && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-700 mb-2">Preview da Imagem:</p>
                      <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                        {/* Imagem */}
                        <ImageWithFallback
                          src={formData.image}
                          alt="Preview"
                          className="w-full h-48 object-cover"
                        />
                        {/* Botão para remover imagem */}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de ação do formulário */}
              <div className="flex gap-3 pt-4">
                {/* Botão Cancelar */}
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
                
                {/* Botão Submit (Criar ou Atualizar) */}
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
