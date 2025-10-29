import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Check, X, Crown, Zap, Infinity, LogOut, Scissors, Menu, User as UserIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { redirectToStripeCheckout } from "@/integrations/stripe/config";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const Pricing = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const plans = [
    {
      id: 'free',
      icon: Calendar,
      title: 'Gratuito',
      description: 'Perfeito para começar',
      price: 'R$ 0',
      features: [
        { text: 'Até 10 agendamentos', included: true },
        { text: 'Nome e endereço do negócio', included: true },
        { text: 'Link personalizado', included: true },
        { text: 'Painel de agendamentos', included: true },
        { text: 'Personalização visual', included: false },
        { text: 'Upload de logo', included: false },
        { text: 'Fundo personalizado', included: false },
      ],
      buttonText: 'Começar Grátis',
      buttonVariant: 'outline' as const,
      badge: null,
    },
    {
      id: 'basic',
      icon: Zap,
      title: 'Básico',
      description: 'Para salões em crescimento',
      price: 'R$ 9,99',
      features: [
        { text: 'Até 45 agendamentos', included: true },
        { text: 'Tudo do plano gratuito', included: true },
        { text: 'Upload de logo', included: true },
        { text: 'Fundo personalizado', included: true },
        { text: 'Cores e imagens', included: true },
        { text: 'Personalização avançada', included: false },
      ],
      buttonText: 'Escolher Básico',
      buttonVariant: 'default' as const,
      badge: 'Mais Popular',
    },
    {
      id: 'premium',
      icon: Crown,
      title: 'Premium',
      description: 'Para salões profissionais',
      price: 'R$ 19,99',
      features: [
        { text: 'Agendamentos ilimitados', included: true, icon: Infinity },
        { text: 'Tudo dos outros planos', included: true },
        { text: 'Personalização completa', included: true },
        { text: 'Fontes personalizadas', included: true },
        { text: 'Cores do modal', included: true },
        { text: 'Suporte prioritário', included: true },
      ],
      buttonText: 'Escolher Premium',
      buttonVariant: 'default' as const,
      badge: null,
    },
  ];

  const scrollToSlide = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = window.innerWidth + 16;
      container.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth',
      });
      setCurrentSlide(index);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const cardWidth = window.innerWidth + 16;
        const newIndex = Math.round(scrollLeft / cardWidth);
        if (newIndex !== currentSlide && newIndex >= 0 && newIndex < plans.length) {
          setCurrentSlide(newIndex);
        }
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentSlide, plans.length]);

  const fetchSalonData = async (userId: string) => {
    const { data: salonData } = await supabase
      .from('salons')
      .select('id, slug, subscription_plan')
      .eq('user_id', userId)
      .maybeSingle();
    setSalon(salonData);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await fetchSalonData(user.id);
        
        // Se voltou de um pagamento, apenas mostrar mensagem - o webhook vai atualizar o plano
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
          toast({
            title: "Redirecionamento do pagamento",
            description: "Aguarde alguns segundos enquanto processamos seu pagamento. O plano será atualizado automaticamente.",
          });
          
          // Limpar storage e parâmetros da URL
          sessionStorage.removeItem('pending_plan_id');
          window.history.replaceState({}, document.title, '/pricing');
        }
      }
    };
    
    checkAuth();
    
    // Verificar mudanças no salão periodicamente (para atualizar plano após pagamento)
    const interval = setInterval(async () => {
      if (user) {
        await fetchSalonData(user.id);
      }
    }, 5000); // Verifica a cada 5 segundos
    
    return () => clearInterval(interval);
  }, [user]);

  const handleCheckout = async (planId: 'basic' | 'premium') => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Por favor, faça login para assinar um plano.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!salon) {
      toast({
        title: "Salão não encontrado",
        description: "Por favor, crie um salão primeiro no Dashboard.",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    // Se já está no plano atual, não permitir pagar novamente
    if (salon.subscription_plan === planId) {
      toast({
        title: "Você já está neste plano",
        description: "Este é o seu plano atual.",
        variant: "default",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Salvar o plano que está sendo contratado no sessionStorage
      sessionStorage.setItem('pending_plan_id', planId);
      
      // Redirecionar para o checkout do Stripe
      await redirectToStripeCheckout(planId, user.id, salon.id, user.email);
    } catch (error: any) {
      sessionStorage.removeItem('pending_plan_id');
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar o pagamento.",
        variant: "destructive",
      });
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
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Agendamentos
              </Link>
              <Link 
                to="/pricing" 
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
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
                      ReutBook
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
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Calendar className="h-5 w-5" />
                          <span>Agendamentos</span>
                        </Link>
                        
                        <Link 
                          to="/pricing" 
                          className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary transition-colors"
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

      {/* Pricing Section */}
      <section className="py-20 md:px-4">
        <div className="container mx-auto px-0 md:px-4">
          <div className="text-center mb-16 px-4 md:px-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Escolha seu plano
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e evolua conforme sua necessidade
            </p>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const IconComponent = plan.icon;
              const isCurrentPlan = salon?.subscription_plan === plan.id;
              return (
                <Card 
                  key={plan.id} 
                  className={`shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 ${
                    plan.badge ? 'border-primary/20 relative' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {plan.badge && !isCurrentPlan && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      {plan.badge}
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center ${
                      plan.id === 'premium' 
                        ? 'bg-gradient-to-r from-primary to-[hsl(340,100%,70%)]' 
                        : 'bg-primary/10'
                    }`}>
                      <IconComponent className={`h-6 w-6 ${
                        plan.id === 'premium' ? 'text-white' : 'text-primary'
                      }`} />
                    </div>
                    <CardTitle className="text-2xl">{plan.title}</CardTitle>
                    <CardDescription className="text-lg">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {plan.features.map((feature, idx) => {
                        const FeatureIcon = feature.icon || (feature.included ? Check : X);
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <FeatureIcon className={`h-4 w-4 ${
                              feature.included ? 'text-green-500' : 'text-red-500'
                            }`} />
                            <span className={`text-sm ${
                              !feature.included ? 'text-muted-foreground' : ''
                            }`}>
                              {feature.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {plan.id === 'free' ? (
                      <Link to="/auth" className="block">
                        <Button 
                          className={`w-full ${
                            plan.buttonVariant === 'default' 
                              ? 'bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] hover:opacity-90' 
                              : ''
                          }`}
                          variant={plan.buttonVariant}
                        >
                          {plan.buttonText}
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className={`w-full ${
                          plan.buttonVariant === 'default' 
                            ? 'bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] hover:opacity-90' 
                            : ''
                        }`}
                        variant={plan.buttonVariant}
                        onClick={() => handleCheckout(plan.id as 'basic' | 'premium')}
                        disabled={loading || isCurrentPlan}
                      >
                        {loading ? 'Processando...' : isCurrentPlan ? 'Plano Atual' : plan.buttonText}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden relative">
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-scroll snap-x snap-mandatory scrollbar-hide gap-4 pb-4"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                overscrollBehaviorX: 'contain',
                scrollBehavior: 'smooth',
              }}
            >
              {plans.map((plan, index) => {
                const IconComponent = plan.icon;
                const isCurrentPlan = salon?.subscription_plan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className="flex-shrink-0 w-screen snap-start snap-always"
                  >
                    <Card className={`shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 h-full ${
                      plan.badge ? 'border-primary/20 relative' : ''
                    } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
                      {plan.badge && !isCurrentPlan && (
                        <Badge className="absolute top-2 md:-top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs md:text-sm z-10">
                          {plan.badge}
                        </Badge>
                      )}
                      <CardHeader className={`text-center pb-4 ${plan.badge ? 'pt-8 md:pt-6' : ''}`}>
                        <div className={`mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center ${
                          plan.id === 'premium' 
                            ? 'bg-gradient-to-r from-primary to-[hsl(340,100%,70%)]' 
                            : 'bg-primary/10'
                        }`}>
                          <IconComponent className={`h-6 w-6 ${
                            plan.id === 'premium' ? 'text-white' : 'text-primary'
                          }`} />
                        </div>
                        <CardTitle className="text-2xl">{plan.title}</CardTitle>
                        <CardDescription className="text-lg">
                          {plan.description}
                        </CardDescription>
                        <div className="mt-4">
                          <span className="text-4xl font-bold">{plan.price}</span>
                          <span className="text-muted-foreground">/mês</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          {plan.features.map((feature, idx) => {
                            const FeatureIcon = feature.icon || (feature.included ? Check : X);
                            return (
                              <div key={idx} className="flex items-center gap-3">
                                <FeatureIcon className={`h-4 w-4 ${
                                  feature.included ? 'text-green-500' : 'text-red-500'
                                }`} />
                                <span className={`text-sm ${
                                  !feature.included ? 'text-muted-foreground' : ''
                                }`}>
                                  {feature.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {plan.id === 'free' ? (
                          <Link to="/auth" className="block">
                            <Button 
                              className={`w-full ${
                                plan.buttonVariant === 'default' 
                                  ? 'bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] hover:opacity-90' 
                                  : ''
                              }`}
                              variant={plan.buttonVariant}
                            >
                              {plan.buttonText}
                            </Button>
                          </Link>
                        ) : (
                          <Button 
                            className={`w-full ${
                              plan.buttonVariant === 'default' 
                                ? 'bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] hover:opacity-90' 
                                : ''
                            }`}
                            variant={plan.buttonVariant}
                            onClick={() => handleCheckout(plan.id as 'basic' | 'premium')}
                            disabled={loading || isCurrentPlan}
                          >
                            {loading ? 'Processando...' : isCurrentPlan ? 'Plano Atual' : plan.buttonText}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
            
            {/* Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {plans.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    currentSlide === index
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-muted-foreground/30'
                  }`}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
