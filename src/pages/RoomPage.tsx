import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { useHotkeys } from "react-hotkeys-hook";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [showHelpModal, setShowHelpModal] = useState(false);
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
  const castVote = useMutation(api.voting.castVote);
  const toggleReveal = useMutation(api.voting.toggleReveal);
  const resetVotes = useMutation(api.voting.resetVotes);

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
          void saveRoomToHistory(roomId, room.name);
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

    const heartbeatInterval = setInterval(() => {
      void (async () => {
        try {
          await updateHeartbeat({ participantId });
          await updateRoomActivity({ roomId: roomId as Id<"rooms"> });
        } catch (error) {
          console.error("Heartbeat failed:", error);
        }
      })();
    }, 10000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [participantId, updateHeartbeat, updateRoomActivity, roomId]);

  // Handle page unload
  useEffect(() => {
    if (!participantId) return;

    const handleBeforeUnload = () => {
      void (async () => {
        try {
          await setConnectionStatus({ participantId, connected: false });
        } catch (error) {
          console.error("Failed to set disconnected status:", error);
        }
      })();
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

  // Hotkey handlers
  const handleVote = async (value: number | null) => {
    if (!participantId || !roomId) return;

    try {
      await castVote({
        roomId: roomId as Id<"rooms">,
        participantId,
        value,
      });
    } catch (error) {
      console.error("Failed to cast vote:", error);
      toast({
        title: "Error",
        description: "Failed to cast vote",
        variant: "destructive",
      });
    }
  };

  const handleToggleReveal = async () => {
    if (!voteStatus || !roomId) return;

    try {
      await toggleReveal({
        roomId: roomId as Id<"rooms">,
        revealed: !voteStatus.revealed,
      });

      toast({
        title: voteStatus.revealed ? "Votes Hidden" : "Votes Revealed",
        description: voteStatus.revealed
          ? "All votes are now hidden from view"
          : "All votes are now visible to everyone",
      });
    } catch (error) {
      console.error("Failed to toggle reveal:", error);
      toast({
        title: "Error",
        description: "Failed to toggle vote visibility",
        variant: "destructive",
      });
    }
  };

  const handleClearVotes = async () => {
    if (!roomId) return;

    try {
      await resetVotes({ roomId: roomId as Id<"rooms"> });
      toast({
        title: "New Round Started",
        description: "Votes have been reset for a new round",
      });
    } catch (error) {
      console.error("Failed to reset votes:", error);
      toast({
        title: "Error",
        description: "Failed to reset votes",
        variant: "destructive",
      });
    }
  };

  // Voting hotkeys - numbers 0-8
  useHotkeys("shift+0", () => void handleVote(0), {
    preventDefault: true,
    enableOnFormTags: false,
  });
  useHotkeys("shift+1", () => void handleVote(1), {
    preventDefault: true,
    enableOnFormTags: false,
  });
  useHotkeys("shift+2", () => void handleVote(2), {
    preventDefault: true,
    enableOnFormTags: false,
  });
  useHotkeys("shift+3", () => void handleVote(3), {
    preventDefault: true,
    enableOnFormTags: false,
  });
  useHotkeys("shift+5", () => void handleVote(5), {
    preventDefault: true,
    enableOnFormTags: false,
  });
  useHotkeys("shift+8", () => void handleVote(8), {
    preventDefault: true,
    enableOnFormTags: false,
  });

  // Additional voting options
  useHotkeys("shift+q", () => void handleVote(null), {
    preventDefault: true,
    enableOnFormTags: false,
  }); // ? card
  useHotkeys("shift+p", () => void handleVote(-1), {
    preventDefault: true,
    enableOnFormTags: false,
  }); // Pass

  // Control hotkeys
  useHotkeys("shift+r", () => void handleToggleReveal(), {
    preventDefault: true,
    enableOnFormTags: false,
  });
  useHotkeys("shift+c", () => void handleClearVotes(), {
    preventDefault: true,
    enableOnFormTags: false,
  });

  // Help hotkey
  useHotkeys("shift+/", () => setShowHelpModal(true), {
    preventDefault: true,
    enableOnFormTags: false,
  });

  // Leave room hotkey
  useHotkeys(
    "shift+e",
    () => {
      if (window.confirm("Are you sure you want to leave the room?")) {
        navigate("/");
      }
    },
    { preventDefault: true, enableOnFormTags: false },
  );

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <RoomDetailsDrawer />
            <RoomHeader room={room} />
          </div>
          <ClearVoteButton roomId={roomId} />
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <ToggleVoteButton />
            <Button
              variant="outline"
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1"
            >
              ⌨ Hotkeys
            </Button>
            <UserBlock
              currentParticipantName={currentParticipant?.name}
              participantId={participantId}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Participants */}
          <div className="lg:col-span-2 order-2 lg:order-1">
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
          <div className="order-1 lg:order-2">
            <VoteCardGrid participantId={participantId} />
          </div>
        </div>
      </div>

      {/* Hotkeys Help Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Voting Cards</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + 0
                  </kbd>{" "}
                  → Vote 0
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + 1
                  </kbd>{" "}
                  → Vote 1
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + 2
                  </kbd>{" "}
                  → Vote 2
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + 3
                  </kbd>{" "}
                  → Vote 3
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + 5
                  </kbd>{" "}
                  → Vote 5
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + 8
                  </kbd>{" "}
                  → Vote 8
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + Q
                  </kbd>{" "}
                  → Vote ? (unsure)
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + P
                  </kbd>{" "}
                  → Pass
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Vote Controls</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + R
                  </kbd>{" "}
                  → Reveal/Hide votes
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + C
                  </kbd>{" "}
                  → Clear all votes
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Navigation</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + E
                  </kbd>{" "}
                  → Exit room
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                    Shift + ?
                  </kbd>{" "}
                  → Show this help
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 All shortcuts use the Shift key to avoid conflicts with
                browser shortcuts.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
