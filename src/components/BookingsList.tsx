import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BookingsListProps {
  salonId: string;
}

const BookingsList = ({ salonId }: BookingsListProps) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("salon_id", salonId)
        .order("booking_date", { ascending: false })
        .order("booking_time", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando agendamentos...</p>;
  }

  if (bookings.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Nenhum agendamento ainda.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Observações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">{booking.customer_name}</TableCell>
              <TableCell>
                {booking.customer_email && <div className="text-sm">{booking.customer_email}</div>}
                {booking.customer_phone && <div className="text-sm">{booking.customer_phone}</div>}
              </TableCell>
              <TableCell>
                {format(new Date(booking.booking_date), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>{booking.booking_time}</TableCell>
              <TableCell className="max-w-xs truncate">{booking.notes || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BookingsList;
