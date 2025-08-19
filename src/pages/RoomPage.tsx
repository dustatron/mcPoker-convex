import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ParticipantCards } from "../components/ParticipantCards";
import { VoteResults } from "../components/VoteResults";
import { VoteDistribution } from "../components/VoteDistribution";
import { useToast } from "../components/ui/use-toast";
import { UserBlock } from "@/components/UserBlock";
import { RoomDetailsDrawer } from "@/components/RoomDetailsDrawer";
import { RoomHeader } from "@/components/RoomHeader";
import { saveRoomToHistory } from "./utils/saveRoomToHistory";
import { ToggleVoteButton } from "@/components/ToggleVoteButton";
import { ClearVoteButton } from "@/components/ClearVoteButton";
import { VoteCardGrid } from "@/components/VoteCardGrid";

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [participantName] = useState<string>(
    localStorage.getItem("mcPoker_participantName") || "",
  );
  const [participantId, setParticipantId] = useState<Id<"participants"> | null>(
    null,
  );
  const [isJoining, setIsJoining] = useState(true);
  const { toast } = useToast();

  // Get vote status for the room
  const voteStatus = useQuery(api.voting.getVoteStatus, {
    roomId: roomId as Id<"rooms">,
  });

  // Mutations for vote controls

  const room = useQuery(api.rooms.getRoom, { id: roomId as Id<"rooms"> });
  const participants = useQuery(api.participants.getParticipantsInRoom, {
    roomId: roomId as Id<"rooms">,
  });
  const votes = useQuery(api.voting.getVotesInRoom, {
    roomId: roomId as Id<"rooms">,
  });

  const joinRoom = useMutation(api.participants.joinRoom);

  const setConnectionStatus = useMutation(
    api.participants.setParticipantConnectionStatus,
  );
  const updateHeartbeat = useMutation(
    api.participants.updateParticipantHeartbeat,
  );
  const updateRoomActivity = useMutation(api.rooms.updateRoomActivity);

  // Join room on mount
  useEffect(() => {
    const joinRoomAsync = async () => {
      try {
        const id = await joinRoom({
          roomId: roomId as Id<"rooms">,
          name: participantName,
        });
        setParticipantId(id);
        setIsJoining(false);

        // Save participantId to localStorage
        localStorage.setItem("mcPoker_participantId", id);

        // Save room to history when successfully joined
        if (room && roomId) {
          saveRoomToHistory(roomId, room.name);
        }

        toast({
          title: "Joined Room",
          description: `Welcome to ${room?.name || "the room"}!`,
        });
      } catch (error) {
        console.error("Failed to join room:", error);
        toast({
          title: "Error",
          description: "Failed to join room",
          variant: "destructive",
        });
      }
    };

    if (room && !participantId && roomId && participantName) {
      joinRoomAsync();
    }
  }, [room, participantId, joinRoom, roomId, participantName, toast]);

  // Heartbeat to maintain connection
  useEffect(() => {
    if (!participantId || !roomId) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        await updateHeartbeat({ participantId });
        await updateRoomActivity({ roomId: roomId as Id<"rooms"> });
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    }, 10000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [participantId, updateHeartbeat, updateRoomActivity, roomId]);

  // Handle page unload
  useEffect(() => {
    if (!participantId) return;

    const handleBeforeUnload = async () => {
      try {
        await setConnectionStatus({ participantId, connected: false });
      } catch (error) {
        console.error("Failed to set disconnected status:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [participantId, setConnectionStatus]);

  // Redirect if no participant name
  useEffect(() => {
    if (!participantName && roomId) {
      // Redirect to landing page with room ID as query parameter
      navigate(`/?room=${roomId}`);
    }
  }, [participantName, navigate, roomId]);

  if (isJoining || !room || !participants || !votes || !participantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Joining room...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we connect you to the room.
          </p>
        </div>
      </div>
    );
  }

  const currentParticipant = participants.find((p) => p._id === participantId);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            <RoomDetailsDrawer />
            <RoomHeader room={room} />
          </div>
          <div className="flex items-center gap-4">
            <ToggleVoteButton />
            <ClearVoteButton roomId={roomId} />
            <UserBlock
              currentParticipantName={currentParticipant?.name}
              participantId={participantId}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Participants */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Participants ({participants.length})
              </h2>
            </div>

            <ParticipantCards
              participants={participants}
              votes={votes}
              voteStatus={voteStatus}
            />
            <div className="flex justify-start flex-shrink-0 w-full mt-4 space-x-4 h-48">
              <VoteDistribution
                votes={votes}
                revealed={voteStatus?.revealed || false}
                votedCount={voteStatus?.votedCount || 0}
              />
              <VoteResults
                votes={votes}
                revealed={voteStatus?.revealed || false}
                votedCount={voteStatus?.votedCount || 0}
              />
            </div>
          </div>

          {/* Right Column - Voting */}
          <VoteCardGrid participantId={participantId} />
        </div>
      </div>
    </div>
  );
}
