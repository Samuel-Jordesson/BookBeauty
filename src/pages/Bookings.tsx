import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { LogOut, Calendar, Search, Clock, User as UserIcon, Phone, Mail, Scissors, Menu, Trash2, ExternalLink, Copy } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  notes: string | null;
  created_at: string;
  salon: {
    name: string;
    slug: string;
  };
}

const Bookings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [salon, setSalon] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm]);

  // Atualizar lista a cada minuto para remover agendamentos que passaram de 15 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      filterBookings();
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [bookings, searchTerm]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const fetchBookings = async () => {
    if (!user) return;

    try {
      // Buscar o salão do usuário
      const { data: salonData, error: salonError } = await supabase
        .from("salons")
        .select("id, slug, subscription_plan")
        .eq("user_id", user.id)
        .single();

      if (salonError || !salonData) {
        toast({
          title: "Erro",
          description: "Salão não encontrado.",
          variant: "destructive",
        });
        return;
      }

      setSalon(salonData);

      // Buscar todos os agendamentos do salão
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          customer_name,
          customer_email,
          customer_phone,
          booking_date,
          booking_time,
          notes,
          created_at,
          salon:salons(name, slug)
        `)
        .eq("salon_id", salonData.id)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });

      if (error) throw error;

      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filtrar por nome se houver termo de busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(booking =>
        booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar agendamentos que passaram de 15 minutos
    filtered = filtered.filter(booking => {
      const bookingDateTime = parseISO(`${booking.booking_date}T${booking.booking_time}`);
      const now = new Date();
      const timeDiff = now.getTime() - bookingDateTime.getTime();
      const minutesPassed = timeDiff / (1000 * 60);

      // Se passou do prazo e já passou de 15 minutos, não mostrar
      if (isPast(bookingDateTime) && minutesPassed > 15) {
        return false;
      }

      return true;
    });

    setFilteredBookings(filtered);
  };

  const getBookingStatus = (date: string, time: string) => {
    const bookingDateTime = parseISO(`${date}T${time}`);
    const now = new Date();

    if (isPast(bookingDateTime)) {
      return { label: "Realizado", variant: "secondary" as const };
    } else if (isToday(bookingDateTime)) {
      return { label: "Hoje", variant: "default" as const };
    } else if (isTomorrow(bookingDateTime)) {
      return { label: "Amanhã", variant: "outline" as const };
    } else {
      return { label: "Futuro", variant: "outline" as const };
    }
  };

  const getBookingContainerStyle = (date: string, time: string) => {
    const bookingDateTime = parseISO(`${date}T${time}`);
    const now = new Date();
    const timeDiff = now.getTime() - bookingDateTime.getTime();
    const minutesPassed = timeDiff / (1000 * 60);

    // Se passou do prazo e ainda não passou 15 minutos
    if (isPast(bookingDateTime) && minutesPassed <= 15) {
      return {
        borderColor: 'hsl(0 84% 60%)', // Cor primária do site (vermelho)
        backgroundColor: 'hsl(0 84% 60% / 0.1)', // Vermelho com transparência
        animation: 'pulse 2s infinite'
      };
    }

    return {};
  };

  const formatBookingDate = (date: string, time: string) => {
    const bookingDateTime = parseISO(`${date}T${time}`);
    return format(bookingDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const openBookingModal = (booking: Booking) => {
    console.log('Opening modal for booking:', booking);
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeBookingModal = () => {
    setSelectedBooking(null);
    setIsModalOpen(false);
  };

  const copyBookingLink = () => {
    if (salon?.slug) {
      const bookingUrl = `${window.location.origin}/${salon.slug}`;
      navigator.clipboard.writeText(bookingUrl);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    }
  };

  const deleteBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi removido com sucesso.",
      });

      // Atualizar a lista
      fetchBookings();
      
      // Fechar modal se estiver aberto
      if (selectedBooking?.id === bookingId) {
        closeBookingModal();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">ReutBook</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Personalizar
              </Link>
              <Link 
                to="/bookings" 
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Agendamentos
              </Link>
              <Link 
                to="/pricing" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Preços
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Desktop - Nome do usuário e plano */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.email?.split('@')[0] || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground">
                  Plano: {salon?.subscription_plan === 'free' ? 'Gratuito' : salon?.subscription_plan === 'basic' ? 'Básico' : salon?.subscription_plan === 'premium' ? 'Premium' : 'Gratuito'}
                </p>
              </div>
            </div>
            {/* Desktop - Botão Sair */}
            <div className="hidden md:block">
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
            
            {/* Mobile - Menu Lateral */}
            <div className="md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-sm">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Scissors className="h-5 w-5 text-primary" />
                      BookBeauty
                    </SheetTitle>
                    <SheetDescription>
                      Menu de navegação
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="flex flex-col h-full min-h-0">
                    {/* Navegação */}
                    <div className="flex-1 py-4 overflow-y-auto">
                      <nav className="space-y-2">
                        <Link 
                          to="/dashboard" 
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Calendar className="h-5 w-5" />
                          <span>Personalizar</span>
                        </Link>
                        
                        <Link 
                          to="/bookings" 
                          className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Calendar className="h-5 w-5" />
                          <span>Agendamentos</span>
                        </Link>
                        
                        <Link 
                          to="/pricing" 
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Calendar className="h-5 w-5" />
                          <span>Preços</span>
                        </Link>
                      </nav>
                    </div>
                    
                    {/* Informações do Usuário e Sair */}
                    <div className="border-t border-border pt-4 flex-shrink-0">
                      <div className="flex items-center gap-3 p-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{user?.email?.split('@')[0] || 'Usuário'}</p>
                          <p className="text-xs text-muted-foreground">
                            {salon?.subscription_plan === 'free' ? 'Plano Gratuito' : salon?.subscription_plan === 'basic' ? 'Plano Básico' : salon?.subscription_plan === 'premium' ? 'Plano Premium' : 'Plano Gratuito'}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-sm"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLogout();
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
            <h1 className="text-3xl font-bold">Agendamentos</h1>
            {salon?.slug && (
              <div className="flex items-center gap-2">
                <a
                  href={`${window.location.origin}/${salon.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Ver link</span>
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyBookingLink}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar link
                </Button>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">
            Gerencie todos os agendamentos do seu salão
          </p>
        </div>

        {/* Barra de Pesquisa */}
        <Card className="mb-6 shadow-[var(--shadow-card)]">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => isToday(parseISO(`${b.booking_date}T${b.booking_time}`))).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Amanhã</p>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => isTomorrow(parseISO(`${b.booking_date}T${b.booking_time}`))).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Realizados</p>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => isPast(parseISO(`${b.booking_date}T${b.booking_time}`))).length}
                  </p>
                </div>
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Agendamentos */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Lista de Agendamentos
            </CardTitle>
            <CardDescription>
              {filteredBookings.length} agendamento(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "Nenhum agendamento encontrado" : "Nenhum agendamento"}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "Tente pesquisar com outro termo" 
                    : "Os agendamentos aparecerão aqui quando seus clientes fizerem reservas"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => {
                  const status = getBookingStatus(booking.booking_date, booking.booking_time);
                  const containerStyle = getBookingContainerStyle(booking.booking_date, booking.booking_time);
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                      style={containerStyle}
                    >
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => openBookingModal(booking)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {booking.customer_name}
                          </h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatBookingDate(booking.booking_date, booking.booking_time)}
                            </div>
                            
                            {booking.customer_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {booking.customer_phone}
                              </div>
                            )}
                          </div>
                          
                          {booking.customer_email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              {booking.customer_email}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBooking(booking.id);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 hidden md:flex"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Agendamento */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Detalhes do Agendamento
              </DialogTitle>
              <DialogDescription>
                Informações completas do agendamento
              </DialogDescription>
            </DialogHeader>
            
            {selectedBooking && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações do Cliente */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Informações do Cliente
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nome</p>
                          <p className="font-medium">{selectedBooking.customer_name}</p>
                        </div>
                      </div>
                      
                      {selectedBooking.customer_phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Telefone</p>
                            <a 
                              href={`tel:${selectedBooking.customer_phone}`}
                              className="font-medium text-primary hover:underline cursor-pointer"
                            >
                              {selectedBooking.customer_phone}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {selectedBooking.customer_email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <a 
                              href={`mailto:${selectedBooking.customer_email}`}
                              className="font-medium text-primary hover:underline cursor-pointer"
                            >
                              {selectedBooking.customer_email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações do Agendamento */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Informações do Agendamento
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Data e Hora</p>
                          <p className="font-medium">
                            {formatBookingDate(selectedBooking.booking_date, selectedBooking.booking_time)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant={getBookingStatus(selectedBooking.booking_date, selectedBooking.booking_time).variant}>
                            {getBookingStatus(selectedBooking.booking_date, selectedBooking.booking_time).label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Scissors className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Salão</p>
                          <p className="font-medium">{selectedBooking.salon.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {selectedBooking.notes && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Observações</h3>
                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="text-sm italic">"{selectedBooking.notes}"</p>
                    </div>
                  </div>
                )}

                {/* Informações Técnicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações Técnicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <p><strong>ID do Agendamento:</strong></p>
                      <p className="break-all">{selectedBooking.id}</p>
                    </div>
                    <div>
                      <p><strong>Data de Criação:</strong></p>
                      <p>{format(parseISO(selectedBooking.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  </div>
                </div>

                {/* Botão de Deletar */}
                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este agendamento?')) {
                        deleteBooking(selectedBooking.id);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Agendamento
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Bookings;
