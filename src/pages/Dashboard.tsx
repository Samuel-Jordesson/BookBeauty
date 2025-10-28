import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { LogOut, Calendar, Settings, ExternalLink, Scissors, Menu, User as UserIcon } from "lucide-react";
import SalonSettings from "@/components/SalonSettings";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null);
          if (!session) {
            navigate("/auth");
          }
        }
      );

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchSalon(session.user.id);
        
        // Verificar mudanças no salão periodicamente (para atualizar plano após pagamento)
        const interval = setInterval(() => {
          if (session?.user) {
            fetchSalon(session.user.id);
          }
        }, 3000); // Verifica a cada 3 segundos
        
        return () => {
          subscription.unsubscribe();
          clearInterval(interval);
        };
      } else {
        navigate("/auth");
      }

      return () => subscription.unsubscribe();
    };

    initializeAuth();
  }, [navigate]);

  const fetchSalon = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("salons")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      // Se o plano mudou, mostrar mensagem
      if (salon && data && salon.subscription_plan !== data.subscription_plan) {
        const planNames = {
          'free': 'Gratuito',
          'basic': 'Básico',
          'premium': 'Premium'
        };
        toast({
          title: "Plano atualizado!",
          description: `Seu plano foi atualizado para ${planNames[data.subscription_plan as keyof typeof planNames] || data.subscription_plan}.`,
        });
      }
      
      setSalon(data);
      
      // Se voltou de um pagamento, apenas mostrar mensagem - o webhook vai atualizar o plano
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        toast({
          title: "Redirecionamento do pagamento",
          description: "Aguarde alguns segundos enquanto processamos seu pagamento. O plano será atualizado automaticamente.",
        });
        
        // Limpar storage e parâmetros da URL
        sessionStorage.removeItem('pending_plan_id');
        window.history.replaceState({}, document.title, '/dashboard');
      }
    } catch (error: any) {
      console.error("Error fetching salon:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/");
  };

  const handleSalonUpdate = () => {
    if (user) {
      fetchSalon(user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const bookingUrl = salon ? `${window.location.origin}/${salon.slug}` : "";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">BookBeauty</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Personalizar
              </Link>
              <Link 
                to="/bookings" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
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
                          className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Calendar className="h-5 w-5" />
                          <span>Personalizar</span>
                        </Link>
                        
                        <Link 
                          to="/bookings" 
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
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
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configurações do Salão
              </CardTitle>
              <CardDescription>
                Configure os dados do seu negócio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalonSettings
                salon={salon}
                userId={user?.id || ""}
                onUpdate={handleSalonUpdate}
              />
            </CardContent>
          </Card>

          {salon && (
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  Link de Agendamento
                </CardTitle>
                <CardDescription>
                  Compartilhe este link com seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Seu link público:</p>
                    <a
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline break-all"
                    >
                      {bookingUrl}
                    </a>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] hover:opacity-90"
                    onClick={() => {
                      navigator.clipboard.writeText(bookingUrl);
                      toast({
                        title: "Link copiado!",
                        description: "O link foi copiado para a área de transferência.",
                      });
                    }}
                  >
                    Copiar Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
