import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/Layout";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useToast } from "@/components/ui/use-toast";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on a room page
  const isRoomPage = location.pathname.startsWith("/room/");

  // Extract roomId from the path if on a room page
  const roomId = isRoomPage ? location.pathname.split("/").pop() : null;

  // Get the leaveRoom mutation
  const leaveRoom = useMutation(api.participants.leaveRoom);
  const { toast } = useToast();

  const handleLeaveRoom = async () => {
    // Get participantId from localStorage
    const participantIdStr = localStorage.getItem("mcPoker_participantId");

    if (participantIdStr) {
      try {
        // Convert string to Id<"participants"> type
        const participantId = participantIdStr as Id<"participants">;

        await leaveRoom({ participantId });

        toast({
          title: "Left Room",
          description: "You have successfully left the room.",
        });

        // Clear the participantId from localStorage
        localStorage.removeItem("mcPoker_participantId");
      } catch (error) {
        console.error("Failed to leave room:", error);
        toast({
          title: "Error",
          description: "Failed to leave room",
          variant: "destructive",
        });
      }
    }

    // Navigate back to the landing page
    navigate("/");
  };

  return (
    <Layout
      menu={
        <div className="text-sm text-gray-600">
          McPoker v1.0
          {isRoomPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveRoom}
              className="ml-4 text-red-500 hover:bg-red-50"
            >
              Leave Room
            </Button>
          )}
        </div>
      }
    >
      <Outlet />
      <Toaster />
    </Layout>
  );
}
