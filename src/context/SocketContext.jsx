import { io } from "socket.io-client";
import { createContext, useEffect } from "react";
import { toast } from "sonner";
import { useSelector } from "react-redux";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket"],
  reconnectionAttempts: 3,
  reconnectionDelay: 3000,
});

export const SocketContext = createContext(socket);

export const SocketProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user?.token) return;

    socket.auth = { token: user.token };
    socket.connect();

    // User-specific notifications
    socket.on('booking-confirmed', (data) => {
      toast.success(`Booking Confirmed for Seat ${data.seat}`, {
        description: `Date: ${new Date(data.date).toLocaleDateString()}`,
        action: {
          label: "View",
          onClick: () => window.open(`/my-bookings/${data._id}`)
        }
      });
    });

    socket.on('payment-processed', (data) => {
      toast.success(`Payment Processed`, {
        description: `₹${data.amount} for booking #${data.bookingId}`,
      });
    });

    socket.on('booking-failed', (data) => {
      toast.error("Booking Failed", {
        description: data.message,
      });
    });

    // Admin/Librarian notifications
    if (user.role === 'admin' || user.role === 'librarian') {
      socket.on('booking-created', (data) => {
        toast.message("New Booking", {
          description: `${data.user.name} booked seat ${data.seat.number}`,
          action: {
            label: "Manage",
            onClick: () => window.open(`/admin/bookings/${data._id}`)
          }
        });
      });
    }

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      toast.warning("Disconnected", {
        description: "Reconnecting to real-time service...",
      });
    });

    socket.on('connect_error', (err) => {
      toast.error("Connection Error", {
        description: err.message || "Failed to connect to real-time updates",
      });
    });

    return () => {
      socket.off('booking-confirmed');
      socket.off('payment-processed');
      socket.off('booking-failed');
      socket.off('booking-created');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [user?.token, user?._id, user?.role, user?.libraryId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};