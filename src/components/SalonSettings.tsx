import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Palette, Camera, Type, Monitor, Eye, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const salonSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  slug: z.string().min(1, "Slug é obrigatório").max(50).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
});

interface SalonSettingsProps {
  salon: any;
  userId: string;
  onUpdate: () => void;
}

const SalonSettings = ({ salon, userId, onUpdate }: SalonSettingsProps) => {
  const subscriptionPlan = salon?.subscription_plan || 'free';
  const isFree = subscriptionPlan === 'free';
  const isBasic = subscriptionPlan === 'basic';
  const isPremium = subscriptionPlan === 'premium';
  const [name, setName] = useState(salon?.name || "");
  const [slug, setSlug] = useState(salon?.slug || "");
  const [phone, setPhone] = useState(salon?.phone || "");
  const [address, setAddress] = useState(salon?.address || "");
  const [logoUrl, setLogoUrl] = useState(salon?.logo_url || "");
  const [logoPreview, setLogoPreview] = useState(salon?.logo_url || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Estados para fundo personalizado
  const [backgroundType, setBackgroundType] = useState<'color' | 'image'>(salon?.background_type || 'color');
  const [backgroundColor, setBackgroundColor] = useState(salon?.background_color || '#1a1a1a');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(salon?.background_image_url || "");
  const [backgroundImagePreview, setBackgroundImagePreview] = useState(salon?.background_image_url || "");
  const [uploadingBackground, setUploadingBackground] = useState(false);
  
  // Estados para personalização do modal
  const [buttonColor, setButtonColor] = useState(salon?.button_color || '#dc2626');
  const [fontFamily, setFontFamily] = useState(salon?.font_family || 'Inter');
  const [modalBackgroundColor, setModalBackgroundColor] = useState(salon?.modal_background_color || '#ffffff');
  const [modalOpacity, setModalOpacity] = useState(salon?.modal_opacity || 95);
  
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fontOptions = [
    { value: 'Inter', label: 'Inter (Padrão)' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Nunito', label: 'Nunito' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' },
    { value: 'Raleway', label: 'Raleway' },
    { value: 'Ubuntu', label: 'Ubuntu' },
  ];

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(true);

    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('salon-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('salon-assets')
        .getPublicUrl(filePath);

      setLogoUrl(data.publicUrl);
      setLogoPreview(data.publicUrl);

      toast({
        title: "Sucesso!",
        description: "Logo enviada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const removeLogo = () => {
    setLogoUrl("");
    setLogoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBackgroundImageUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (máximo 10MB para fundos)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingBackground(true);

    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-bg-${Date.now()}.${fileExt}`;
      const filePath = `backgrounds/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('salon-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('salon-assets')
        .getPublicUrl(filePath);

      setBackgroundImageUrl(data.publicUrl);
      setBackgroundImagePreview(data.publicUrl);

      toast({
        title: "Sucesso!",
        description: "Imagem de fundo enviada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBackgroundImageUpload(file);
    }
  };

  const removeBackgroundImage = () => {
    setBackgroundImageUrl("");
    setBackgroundImagePreview("");
    if (backgroundFileInputRef.current) {
      backgroundFileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      salonSchema.parse({ name, slug, phone, address });
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

    setLoading(true);

    try {
      if (salon) {
        const { error } = await supabase
          .from("salons")
          .update({ 
            name, 
            slug, 
            phone, 
            address, 
            logo_url: logoUrl,
            background_type: backgroundType,
            background_color: backgroundColor,
            background_image_url: backgroundImageUrl,
            button_color: buttonColor,
            font_family: fontFamily,
            modal_background_color: modalBackgroundColor,
            modal_opacity: modalOpacity
          })
          .eq("id", salon.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso!",
          description: "Salão atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("salons")
          .insert({ 
            name, 
            slug, 
            phone, 
            address, 
            logo_url: logoUrl,
            background_type: backgroundType,
            background_color: backgroundColor,
            background_image_url: backgroundImageUrl,
            button_color: buttonColor,
            font_family: fontFamily,
            modal_background_color: modalBackgroundColor,
            modal_opacity: modalOpacity,
            user_id: userId 
          });

        if (error) throw error;
        
        toast({
          title: "Sucesso!",
          description: "Salão criado com sucesso.",
        });
      }
      
      onUpdate();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Logo Upload Section */}
      <div className="space-y-2">
        <Label>Logo do Salão {isFree && <span className="text-xs text-muted-foreground">(Bloqueado no plano gratuito)</span>}</Label>
        {isFree && (
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              Esta funcionalidade está disponível nos planos Básico e Premium. <Link to="/pricing" className="text-primary hover:underline">Upgrade agora</Link>
            </p>
          </div>
        )}
        <div className={`flex items-center gap-4 ${isFree ? 'opacity-50 pointer-events-none' : ''}`}>
          {logoPreview ? (
            <div className="relative">
              <img
                src={logoPreview}
                alt="Logo do salão"
                className="w-20 h-20 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                disabled={isFree}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isFree}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo || isFree}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadingLogo ? "Enviando..." : logoPreview ? "Alterar Logo" : "Adicionar Logo"}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG ou GIF até 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Background Personalization Section */}
      <div className="space-y-4">
        <Label>Fundo da Página de Agendamento {isFree && <span className="text-xs text-muted-foreground">(Bloqueado no plano gratuito)</span>}</Label>
        {isFree && (
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              Esta funcionalidade está disponível nos planos Básico e Premium. <Link to="/pricing" className="text-primary hover:underline">Upgrade agora</Link>
            </p>
          </div>
        )}
        
        {/* Tipo de fundo */}
        <div className={`flex gap-2 ${isFree ? 'opacity-50 pointer-events-none' : ''}`}>
          <Button
            type="button"
            variant={backgroundType === 'color' ? 'default' : 'outline'}
            onClick={() => setBackgroundType('color')}
            className="flex-1"
          >
            <Palette className="h-4 w-4 mr-2" />
            Cor Sólida
          </Button>
          <Button
            type="button"
            variant={backgroundType === 'image' ? 'default' : 'outline'}
            onClick={() => setBackgroundType('image')}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Imagem
          </Button>
        </div>

        {/* Seletor de cor */}
        {backgroundType === 'color' && (
          <div className={`space-y-2 ${isFree ? 'opacity-50 pointer-events-none' : ''}`}>
            <Label htmlFor="backgroundColor">Cor de Fundo</Label>
            <div className="flex items-center gap-3">
              <input
                id="backgroundColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-10 rounded border border-border cursor-pointer"
                disabled={isFree}
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#1a1a1a"
                className="flex-1"
                disabled={isFree}
              />
            </div>
            <div 
              className="w-full h-20 rounded-lg border border-border"
              style={{ backgroundColor: backgroundColor }}
            />
          </div>
        )}

        {/* Upload de imagem */}
        {backgroundType === 'image' && (
          <div className={`space-y-2 ${isFree ? 'opacity-50 pointer-events-none' : ''}`}>
            <Label>Imagem de Fundo</Label>
            <div className="flex items-center gap-4">
              {backgroundImagePreview ? (
                <div className="relative">
                  <img
                    src={backgroundImagePreview}
                    alt="Imagem de fundo"
                    className="w-32 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={removeBackgroundImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1">
                <input
                  ref={backgroundFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundFileChange}
                  className="hidden"
                  disabled={isFree}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => backgroundFileInputRef.current?.click()}
                  disabled={uploadingBackground || isFree}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingBackground ? "Enviando..." : backgroundImagePreview ? "Alterar Imagem" : "Adicionar Imagem"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG ou GIF até 10MB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Personalização do Modal */}
      <div className="space-y-4">
        <div className="border-t border-border pt-4">
          <Label className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalização do Modal de Agendamento {(isFree || isBasic) && <span className="text-xs text-muted-foreground">(Bloqueado no plano {isFree ? 'gratuito' : 'básico'})</span>}
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize a aparência do modal que seus clientes veem
          </p>
        </div>
        
        {(isFree || isBasic) && (
          <div className="p-3 bg-muted rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              Esta funcionalidade está disponível apenas no plano Premium. <Link to="/pricing" className="text-primary hover:underline">Upgrade agora</Link>
            </p>
          </div>
        )}
        
        <div className={`space-y-4 ${(isFree || isBasic) ? 'opacity-50 pointer-events-none' : ''}`}>

        {/* Cor do Botão */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cor do Botão
          </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="w-12 h-10 rounded-full border border-border cursor-pointer overflow-hidden"
                  style={{ borderRadius: '50%' }}
                />
                <Input
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  placeholder="#dc2626"
                  className="flex-1"
                />
              </div>
          <div className="text-xs text-muted-foreground">
            Esta cor será aplicada ao botão "Confirmar Agendamento" e ao contorno dos campos quando clicados
          </div>
          <div className="flex gap-2">
            <div 
              className="w-16 h-8 rounded border border-border flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: buttonColor }}
            >
              Botão
            </div>
            <div 
              className="w-16 h-8 rounded border-2 flex items-center justify-center text-xs"
              style={{ borderColor: buttonColor }}
            >
              Contorno
            </div>
          </div>
        </div>

        {/* Fonte */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Fonte do Modal
          </Label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma fonte" />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            Preview da fonte:
          </div>
          <div 
            className="p-3 border border-border rounded-lg text-lg"
            style={{ fontFamily: fontFamily }}
          >
            Texto de exemplo com a fonte {fontFamily}
          </div>
        </div>

        {/* Cor de Fundo do Modal */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Cor de Fundo do Modal
          </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={modalBackgroundColor}
                  onChange={(e) => setModalBackgroundColor(e.target.value)}
                  className="w-12 h-10 rounded-full border border-border cursor-pointer overflow-hidden"
                  style={{ borderRadius: '50%' }}
                />
                <Input
                  value={modalBackgroundColor}
                  onChange={(e) => setModalBackgroundColor(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
          <div className="text-xs text-muted-foreground">
            Cor de fundo do card principal do modal de agendamento
          </div>
          <div 
            className="w-full h-16 rounded-lg border border-border flex items-center justify-center text-sm"
            style={{ backgroundColor: modalBackgroundColor }}
          >
            Preview do fundo do modal
          </div>
        </div>

        {/* Opacidade do Modal */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Opacidade do Modal
          </Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transparente</span>
              <span className="text-sm font-medium">{modalOpacity}%</span>
              <span className="text-sm text-muted-foreground">Opaco</span>
            </div>
            <Slider
              value={[modalOpacity]}
              onValueChange={(value) => setModalOpacity(value[0])}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Controla a transparência do fundo do modal (conteúdo permanece sólido)
          </div>
          <div className="relative">
            <div 
              className="w-full h-16 rounded-lg border border-border flex items-center justify-center text-sm"
              style={{ 
                backgroundColor: modalBackgroundColor,
                opacity: modalOpacity / 100
              }}
            >
              Fundo com {modalOpacity}% de opacidade
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 px-3 py-1 rounded text-xs font-medium">
                Conteúdo sólido
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome do Salão</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Meu Salão de Beleza"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Link Personalizado</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          placeholder="meu-salao"
          required
        />
        <p className="text-xs text-muted-foreground">
          Seu link será: {window.location.origin}/{slug || "seu-link"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Rua Example, 123"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] hover:opacity-90"
        disabled={loading}
      >
        {loading ? "Salvando..." : salon ? "Atualizar Salão" : "Criar Salão"}
      </Button>
    </form>
  );
};

export default SalonSettings;
