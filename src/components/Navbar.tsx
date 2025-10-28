import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Scissors, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user?.email) {
        // Pega o nome do usuário do email (parte antes do @)
        const nameFromEmail = user.email.split('@')[0];
        setUserName(nameFromEmail);
      }
    };

    checkUser();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        const nameFromEmail = session.user.email.split('@')[0];
        setUserName(nameFromEmail);
      } else {
        setUserName("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNameClick = () => {
    navigate('/bookings');
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Scissors className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">BookBeauty</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <button
              onClick={handleNameClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary transition-colors group"
            >
              <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium text-sm">{userName}</span>
            </button>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-primary to-[hsl(340,100%,70%)] hover:opacity-90">
                  Criar Conta
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
