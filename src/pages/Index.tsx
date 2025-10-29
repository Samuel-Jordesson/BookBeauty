import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Calendar, Share2, Settings, Sparkles, Check, X, Crown, Zap, Infinity, Star, Quote, UserPlus, Link2, Users } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { redirectToStripeCheckout } from "@/integrations/stripe/config";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import heroImage from "@/assets/hero-bg.jpg";
import bookingExampleImage from "@/assets/Frame 24.png";
import dashboardExampleImage from "@/assets/Frame 25.png";
import linkExampleImage from "@/assets/Frame 26.png";

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
      // Largura do card (100vw) + gap (1rem) exceto no último
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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: salonData } = await supabase
          .from('salons')
          .select('id, slug')
          .eq('user_id', user.id)
          .maybeSingle();
        setSalon(salonData);
      }
    };
    
    checkAuth();
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Agendamentos Simplificados para{" "}
              <span className="bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] bg-clip-text text-transparent">
                Salões e Barbearias
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Crie sua página de agendamento em minutos. Seus clientes agendam online, você gerencia tudo em um só lugar.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] hover:opacity-90 text-lg h-14 px-8"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Começar Gratuitamente
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Tudo que você precisa para gerenciar agendamentos
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Agendamento Online</h3>
              <p className="text-muted-foreground">
                Seus clientes agendam diretamente pelo link personalizado. Simples e rápido.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Link Personalizado</h3>
              <p className="text-muted-foreground">
                Crie um link único para seu negócio e compartilhe nas redes sociais.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Painel Completo</h3>
              <p className="text-muted-foreground">
                Visualize todos os agendamentos em tempo real. Controle total do seu negócio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como funciona
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Em apenas 3 passos simples, você terá sua página de agendamento funcionando
            </p>
          </div>

          <div className="max-w-6xl mx-auto space-y-16">
            {/* Passo 1 - Exemplo à direita */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">1. Crie sua conta</h3>
                  <p className="text-muted-foreground">
                    Cadastre-se gratuitamente e configure os dados básicos do seu negócio: nome, endereço e telefone.
                  </p>
                </div>
              </div>

              {/* Exemplo 1 - Página de Agendamento */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-[var(--shadow-card)]">
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={bookingExampleImage} 
                    alt="Página de agendamento personalizada" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Passo 2 - Exemplo à esquerda */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Exemplo 2 - Painel de Controle */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-[var(--shadow-card)] order-2 lg:order-1">
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={dashboardExampleImage} 
                    alt="Painel de controle do negócio" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>

              <div className="flex gap-6 order-1 lg:order-2">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Link2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">2. Personalize sua página</h3>
                  <p className="text-muted-foreground">
                    Escolha as cores, fontes e adicione sua logo. Sua página ficará com a identidade visual do seu negócio.
                  </p>
                </div>
              </div>
            </div>

            {/* Passo 3 - Exemplo à direita */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">3. Compartilhe e receba agendamentos</h3>
                  <p className="text-muted-foreground">
                    Compartilhe seu link personalizado nas redes sociais e comece a receber agendamentos automaticamente.
                  </p>
                </div>
              </div>

              {/* Exemplo 3 - Link Compartilhado */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-[var(--shadow-card)]">
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={linkExampleImage} 
                    alt="Link personalizado para compartilhar" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:px-4">
        <div className="container mx-auto px-0 md:px-4">
          <div className="text-center mb-16 px-4 md:px-0">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha seu plano
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comece grátis e evolua conforme sua necessidade
            </p>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plano Gratuito */}
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Gratuito</CardTitle>
                <CardDescription className="text-lg">
                  Perfeito para começar
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">R$ 0</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Até 10 agendamentos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Nome e endereço do negócio</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Link personalizado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Painel de agendamentos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <X className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Personalização visual</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <X className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Upload de logo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <X className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Fundo personalizado</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={async () => {
                    // Se usuário estiver logado, atualizar plano para free
                    if (user && salon) {
                      try {
                        const { error } = await supabase
                          .from('salons')
                          .update({ subscription_plan: 'free' })
                          .eq('id', salon.id);
                        
                        if (!error) {
                          toast({
                            title: "Plano gratuito ativado!",
                            description: "Você agora está no plano gratuito.",
                          });
                          // Recarregar dados do salão
                          const { data: salonData } = await supabase
                            .from('salons')
                            .select('id, slug')
                            .eq('user_id', user.id)
                            .maybeSingle();
                          setSalon(salonData);
                        }
                      } catch (error: any) {
                        console.error('Erro ao atualizar plano:', error);
                      }
                    }
                    navigate('/auth');
                  }}
                >
                  Começar Grátis
                </Button>
              </CardContent>
            </Card>

            {/* Plano Básico */}
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 border-primary/20 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                Mais Popular
              </Badge>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Básico</CardTitle>
                <CardDescription className="text-lg">
                  Para salões em crescimento
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">R$ 9,99</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Até 45 agendamentos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Tudo do plano gratuito</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Upload de logo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Fundo personalizado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Cores e imagens</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <X className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Personalização avançada</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] hover:opacity-90"
                  onClick={() => handleCheckout('basic')}
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Escolher Básico'}
                </Button>
              </CardContent>
            </Card>

            {/* Plano Premium */}
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Premium</CardTitle>
                <CardDescription className="text-lg">
                  Para salões profissionais
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">R$ 19,99</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Infinity className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Agendamentos ilimitados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Tudo dos outros planos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Personalização completa</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Fontes personalizadas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Cores do modal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Suporte prioritário</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] hover:opacity-90"
                  onClick={() => handleCheckout('premium')}
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Escolher Premium'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden relative">
            {/* Gradiente de fade-out na borda direita */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none z-20"
              style={{
                opacity: currentSlide < plans.length - 1 ? 1 : 0,
                transition: 'opacity 0.3s ease',
                background: 'linear-gradient(to right, transparent, rgba(0, 0, 0, 0.6))',
              }}
            />
            
            {/* Gradiente de fade-out na borda esquerda */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none z-20"
              style={{
                opacity: currentSlide > 0 ? 1 : 0,
                transition: 'opacity 0.3s ease',
                background: 'linear-gradient(to left, transparent, rgba(0, 0, 0, 0.6))',
              }}
            />
            
            {/* Indicador de scroll à direita */}
            <div 
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-30"
              style={{
                opacity: currentSlide < plans.length - 1 ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              <div className="bg-primary/20 backdrop-blur-sm rounded-full p-2">
                <Share2 className="h-5 w-5 text-primary rotate-[-45deg]" />
              </div>
            </div>

            {/* Indicador de scroll à esquerda */}
            <div 
              className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-30"
              style={{
                opacity: currentSlide > 0 ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              <div className="bg-primary/20 backdrop-blur-sm rounded-full p-2">
                <Share2 className="h-5 w-5 text-primary rotate-[45deg]" />
              </div>
            </div>

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
                return (
                  <div
                    key={plan.id}
                    className="flex-shrink-0 w-screen snap-start snap-always"
                  >
                    <Card className={`shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 h-full ${
                      plan.badge ? 'border-primary/20 relative' : ''
                    }`}>
                      {plan.badge && (
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
                            disabled={loading}
                          >
                            {loading ? 'Processando...' : plan.buttonText}
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

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Salões e barbearias que já transformaram seus negócios
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Depoimento 1 */}
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-primary mb-4" />
                <p className="text-muted-foreground mb-4 italic">
                  "Antes eu perdia muito tempo atendendo telefone para agendamentos. Agora meus clientes agendam sozinhos e eu foco no que importa: cortar cabelo. Minha barbearia ficou muito mais organizada!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">M</span>
                  </div>
                  <div>
                    <p className="font-semibold">Marcos Silva</p>
                    <p className="text-sm text-muted-foreground">Barbearia do Marcos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Depoimento 2 */}
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-primary mb-4" />
                <p className="text-muted-foreground mb-4 italic">
                  "Incrível como algo tão simples pode fazer tanta diferença! Meus clientes adoram poder agendar pelo celular a qualquer hora. E eu não preciso mais ficar anotando tudo em papel. Recomendo demais!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">A</span>
                  </div>
                  <div>
                    <p className="font-semibold">Ana Costa</p>
                    <p className="text-sm text-muted-foreground">Salão Ana Beauty</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Depoimento 3 */}
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-primary mb-4" />
                <p className="text-muted-foreground mb-4 italic">
                  "Minha esposa sempre reclamava que eu esquecia os agendamentos. Agora com o sistema, tudo fica registrado e eu recebo lembretes. A clientela aumentou 40% desde que comecei a usar!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">R</span>
                  </div>
                  <div>
                    <p className="font-semibold">Roberto Lima</p>
                    <p className="text-sm text-muted-foreground">Barbearia Moderna</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Depoimento 4 */}
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-primary mb-4" />
                <p className="text-muted-foreground mb-4 italic">
                  "O melhor investimento que fiz este ano! Meus clientes ficaram impressionados com a página personalizada. Parece que tenho um site profissional, mas foi super fácil de fazer."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">C</span>
                  </div>
                  <div>
                    <p className="font-semibold">Carla Mendes</p>
                    <p className="text-sm text-muted-foreground">Studio Carla</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Depoimento 5 */}
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-primary mb-4" />
                <p className="text-muted-foreground mb-4 italic">
                  "Antes eu tinha que contratar uma recepcionista só para agendamentos. Agora economizo esse dinheiro e ainda atendo mais clientes. O sistema se paga sozinho!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">J</span>
                  </div>
                  <div>
                    <p className="font-semibold">João Santos</p>
                    <p className="text-sm text-muted-foreground">Barbearia Elite</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Depoimento 6 */}
            <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-primary mb-4" />
                <p className="text-muted-foreground mb-4 italic">
                  "Meus clientes adoram a praticidade! Podem agendar até de madrugada se quiserem. E eu sempre sei quem vem, quando vem e o que querem fazer. Mudou completamente minha rotina!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">L</span>
                  </div>
                  <div>
                    <p className="font-semibold">Luciana Oliveira</p>
                    <p className="text-sm text-muted-foreground">Salão Luci</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-r from-primary/10 to-[hsl(340,100%,70%)]/10 border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Crie sua conta gratuita e comece a receber agendamentos hoje mesmo.
            </p>
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] hover:opacity-90 text-lg h-14 px-8"
              >
                Criar Minha Conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 ReutBook. Sistema de agendamento para salões de beleza.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
