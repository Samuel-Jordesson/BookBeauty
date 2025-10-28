import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Phone, Scissors } from "lucide-react";
import { z } from "zod";

const bookingSchema = z.object({
  customer_name: z.string().min(1, "Nome é obrigatório").max(100),
  customer_email: z.string().email("Email inválido").optional().or(z.literal("")),
  customer_phone: z.string().min(1, "Telefone ou email é obrigatório").max(20),
  booking_date: z.string().min(1, "Data é obrigatória"),
  booking_time: z.string().min(1, "Hora é obrigatória"),
  notes: z.string().max(500).optional(),
});

const Booking = () => {
  const { slug } = useParams();
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalBookings, setTotalBookings] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchSalon();
  }, [slug]);

  const checkBookingLimit = async (salonId: string) => {
    try {
      // Contar apenas agendamentos futuros ou de hoje que ainda não passaram de 15 minutos
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      
      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_date, booking_time")
        .eq("salon_id", salonId);

      if (error) throw error;

      // Filtrar agendamentos válidos (futuros ou recentes)
      const validBookings = (data || []).filter(booking => {
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        const timeDiff = now.getTime() - bookingDateTime.getTime();
        const minutesPassed = timeDiff / (1000 * 60);
        
        // Se ainda não aconteceu OU aconteceu há menos de 15 minutos, conta como válido
        return bookingDateTime > now || (bookingDateTime <= now && minutesPassed <= 15);
      });

      const count = validBookings.length;
      setTotalBookings(count);
      
      // Buscar o plano do salão para determinar o limite
      const { data: salonData } = await supabase
        .from("salons")
        .select("subscription_plan")
        .eq("id", salonId)
        .single();
      
      const plan = salonData?.subscription_plan || 'free';
      const limit = plan === 'premium' ? Infinity : plan === 'basic' ? 45 : 10;
      
      setIsLimitReached(count >= limit);
    } catch (error: any) {
      console.error("Error checking booking limit:", error);
    }
  };

  const fetchSalon = async () => {
    try {
      const { data, error } = await supabase
        .from("salons")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Salão não encontrado",
          description: "Este link não é válido.",
          variant: "destructive",
        });
        return;
      }
      
      setSalon(data);
      
      // Verificar limite de agendamentos (para planos que têm limite)
      if (data.subscription_plan && data.subscription_plan !== 'premium') {
        await checkBookingLimit(data.id);
      }
    } catch (error: any) {
      console.error("Error fetching salon:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do salão.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      bookingSchema.parse({
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        booking_date: date,
        booking_time: time,
        notes,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    if (!email && !phone) {
      toast({
        title: "Erro",
        description: "Informe pelo menos email ou telefone.",
        variant: "destructive",
      });
      return;
    }

    // Verificar limite para planos que têm limite
    if (salon?.subscription_plan && salon.subscription_plan !== 'premium' && isLimitReached) {
      const planNames = {
        'free': 'gratuito',
        'basic': 'básico'
      };
      const limits = {
        'free': 10,
        'basic': 45
      };
      const planName = planNames[salon.subscription_plan as keyof typeof planNames] || 'atual';
      const limit = limits[salon.subscription_plan as keyof typeof limits] || 10;
      
      toast({
        title: "Limite atingido",
        description: `Este salão atingiu o limite de ${limit} agendamentos no plano ${planName}. Por favor, tente novamente mais tarde ou entre em contato com o salão.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Verificar limite novamente antes de inserir (double-check)
      if (salon?.subscription_plan && salon.subscription_plan !== 'premium') {
        const now = new Date();
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("id, booking_date, booking_time")
          .eq("salon_id", salon.id);

        if (!bookingsError && bookingsData) {
          const validBookings = bookingsData.filter(booking => {
            const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
            const timeDiff = now.getTime() - bookingDateTime.getTime();
            const minutesPassed = timeDiff / (1000 * 60);
            return bookingDateTime > now || (bookingDateTime <= now && minutesPassed <= 15);
          });

          const plan = salon.subscription_plan;
          const limit = plan === 'basic' ? 45 : 10;
          
          if (validBookings.length >= limit) {
            const planNames = {
              'free': 'gratuito',
              'basic': 'básico'
            };
            const planName = planNames[plan as keyof typeof planNames] || 'atual';
            
            toast({
              title: "Limite atingido",
              description: `Este salão atingiu o limite de ${limit} agendamentos no plano ${planName}. Por favor, tente novamente mais tarde ou entre em contato com o salão.`,
              variant: "destructive",
            });
            setSubmitting(false);
            await checkBookingLimit(salon.id); // Atualizar estado
            return;
          }
        }
      }

      const { error } = await supabase.from("bookings").insert({
        salon_id: salon.id,
        customer_name: name,
        customer_email: email || null,
        customer_phone: phone || null,
        booking_date: date,
        booking_time: time,
        notes: notes || null,
      });

      if (error) throw error;

      // Atualizar contagem de agendamentos (se não for premium)
      if (salon?.subscription_plan && salon.subscription_plan !== 'premium') {
        await checkBookingLimit(salon.id);
      }

      toast({
        title: "Agendamento confirmado!",
        description: "Seu horário foi reservado com sucesso.",
      });

      setName("");
      setEmail("");
      setPhone("");
      setDate("");
      setTime("");
      setNotes("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Salão não encontrado</CardTitle>
            <CardDescription>Este link não é válido.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Função para obter o estilo do fundo
  const getBackgroundStyle = () => {
    if (salon.background_type === 'image' && salon.background_image_url) {
      return {
        backgroundImage: `url(${salon.background_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    } else if (salon.background_type === 'color' && salon.background_color) {
      return {
        backgroundColor: salon.background_color
      };
    }
    return {};
  };

  // Função auxiliar para converter hex para RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Função para obter o estilo personalizado do modal
  const getModalStyle = () => {
    const style: React.CSSProperties = {
      fontFamily: salon?.font_family || 'Inter',
    };
    
    if (salon?.modal_background_color) {
      if (salon?.modal_opacity !== undefined) {
        // Converter hex para rgba com opacidade
        const rgb = hexToRgb(salon.modal_background_color);
        if (rgb) {
          style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${salon.modal_opacity / 100})`;
        } else {
          style.backgroundColor = salon.modal_background_color;
        }
      } else {
        style.backgroundColor = salon.modal_background_color;
      }
    }
    
    return style;
  };

  // Função para obter o estilo dos inputs
  const getInputStyle = () => {
    return {
      border: 'none',
      outline: 'none',
      fontFamily: salon?.font_family || 'Inter',
      '--tw-ring-color': salon?.button_color || '#dc2626',
      '--tw-ring-offset-color': salon?.button_color || '#dc2626',
    } as React.CSSProperties;
  };

  // Função para obter o estilo do botão
  const getButtonStyle = () => {
    return {
      backgroundColor: salon?.button_color || '#dc2626',
      fontFamily: salon?.font_family || 'Inter',
    };
  };

  return (
    <div 
      className="min-h-screen py-12 px-4"
      style={getBackgroundStyle()}
    >
      <div className="container mx-auto max-w-2xl">
        <Card 
          className="shadow-[var(--shadow-glow)] border-border"
          style={getModalStyle()}
        >
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              {salon.logo_url ? (
                <img
                  src={salon.logo_url}
                  alt={`Logo do ${salon.name}`}
                  className="h-16 w-16 object-cover rounded-lg border border-border"
                />
              ) : (
                <Scissors className="h-16 w-16 text-primary" />
              )}
            </div>
            <CardTitle className="text-3xl">{salon.name}</CardTitle>
            <CardDescription className="space-y-2">
              {salon.phone && (
                <p className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" />
                  {salon.phone}
                </p>
              )}
              {salon.address && (
                <p className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {salon.address}
                </p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Aviso de limite atingido */}
            {salon?.subscription_plan && salon.subscription_plan !== 'premium' && isLimitReached && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-destructive font-semibold mb-1">
                  Limite de agendamentos atingido
                </p>
                <p className="text-sm text-destructive/80">
                  Este salão atingiu o limite de {salon.subscription_plan === 'basic' ? '45' : '10'} agendamentos no plano {salon.subscription_plan === 'basic' ? 'básico' : 'gratuito'} ({totalBookings}/{salon.subscription_plan === 'basic' ? '45' : '10'}). 
                  Por favor, tente novamente mais tarde ou entre em contato com o salão diretamente.
                </p>
              </div>
            )}

            {/* Contador de agendamentos (apenas para planos com limite) */}
            {salon?.subscription_plan && salon.subscription_plan !== 'premium' && !isLimitReached && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Agendamentos ativos: <span className="font-semibold">{totalBookings}/{salon.subscription_plan === 'basic' ? '45' : '10'}</span>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  disabled={(salon?.subscription_plan === 'free' || salon?.subscription_plan === 'basic') && isLimitReached}
                  style={getInputStyle()}
                  className="focus:ring-2 focus:ring-offset-0"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    disabled={(salon?.subscription_plan === 'free' || salon?.subscription_plan === 'basic') && isLimitReached}
                    style={getInputStyle()}
                    className="focus:ring-2 focus:ring-offset-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    disabled={(salon?.subscription_plan === 'free' || salon?.subscription_plan === 'basic') && isLimitReached}
                    style={getInputStyle()}
                    className="focus:ring-2 focus:ring-offset-0"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    disabled={(salon?.subscription_plan === 'free' || salon?.subscription_plan === 'basic') && isLimitReached}
                    style={getInputStyle()}
                    className="focus:ring-2 focus:ring-offset-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hora *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    disabled={(salon?.subscription_plan === 'free' || salon?.subscription_plan === 'basic') && isLimitReached}
                    style={getInputStyle()}
                    className="focus:ring-2 focus:ring-offset-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alguma observação? (opcional)"
                  rows={3}
                  disabled={(salon?.subscription_plan === 'free' || salon?.subscription_plan === 'basic') && isLimitReached}
                  style={getInputStyle()}
                  className="focus:ring-2 focus:ring-offset-0"
                />
              </div>

              <Button
                type="submit"
                className="w-full hover:opacity-90 text-lg h-12 text-white"
                disabled={submitting || ((salon?.subscription_plan === 'free' || salon?.subscription_plan === 'basic') && isLimitReached)}
                style={getButtonStyle()}
              >
                {submitting ? "Confirmando..." : isLimitReached ? "Limite Atingido" : "Confirmar Agendamento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Booking;
