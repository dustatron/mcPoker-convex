import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ParticipantList } from "../components/ParticipantList";
import { VotingPanel } from "../components/VoteButton";
import { HistoryList } from "../components/HistoryList";
import { RoomControls } from "../components/RoomControls";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../components/ui/drawer";
import { useToast } from "../components/ui/use-toast";

// Interface for room history items (same as in LandingPage)
interface RoomHistoryItem {
  id: string;
  name: string;
  timestamp: number;
}

// Function to save room to history (same as in LandingPage)
const saveRoomToHistory = (id: string, name: string) => {
  try {
    // Get existing history or initialize empty array
    const historyJson = localStorage.getItem("mcPoker_roomHistory");
    const history: RoomHistoryItem[] = historyJson
      ? JSON.parse(historyJson)
      : [];

    // Check if room already exists in history
    const existingIndex = history.findIndex((item) => item.id === id);

    // Create new history item
    const historyItem: RoomHistoryItem = {
      id,
      name,
      timestamp: Date.now(),
    };

    // If room exists, update it; otherwise add to history
    if (existingIndex !== -1) {
      history[existingIndex] = historyItem;
    } else {
      // Add new room to history
      history.unshift(historyItem);

      // Keep only the most recent 10 rooms
      if (history.length > 10) {
        history.pop();
      }
    }

    // Save updated history back to localStorage
    localStorage.setItem("mcPoker_roomHistory", JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save room to history:", error);
  }
};

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [participantName, setParticipantName] = useState<string>(
    localStorage.getItem("mcPoker_participantName") || "",
  );
  const [participantId, setParticipantId] = useState<Id<"participants"> | null>(
    null,
  );
  const [isJoining, setIsJoining] = useState(true);
  const [newName, setNewName] = useState(participantName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { toast } = useToast();

  const room = useQuery(api.rooms.getRoom, { id: roomId as Id<"rooms"> });
  const participants = useQuery(api.participants.getParticipantsInRoom, {
    roomId: roomId as Id<"rooms">,
  });
  const votes = useQuery(api.voting.getVotesInRoom, {
    roomId: roomId as Id<"rooms">,
  });

  const joinRoom = useMutation(api.participants.joinRoom);
  const renameParticipant = useMutation(api.participants.renameParticipant);
  const leaveRoom = useMutation(api.participants.leaveRoom);
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
    }, 30000); // Every 30 seconds

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

  const handleRename = async () => {
    if (!participantId || newName.trim() === participantName) {
      setIsEditingName(false);
      return;
    }

    try {
      await renameParticipant({ participantId, newName: newName.trim() });
      localStorage.setItem("mcPoker_participantName", newName.trim());
      setParticipantName(newName.trim());
      setIsEditingName(false);

      toast({
        title: "Name Updated",
        description: `Your name has been changed to ${newName.trim()}`,
      });
    } catch (error) {
      console.error("Failed to rename:", error);
      toast({
        title: "Error",
        description: "Failed to update name",
        variant: "destructive",
      });
    }
  };

  const handleLeaveRoom = async () => {
    if (participantId) {
      try {
        await leaveRoom({ participantId });
        toast({
          title: "Left Room",
          description: "You have successfully left the room.",
        });
      } catch (error) {
        console.error("Failed to leave room:", error);
        toast({
          title: "Error",
          description: "Failed to leave room",
          variant: "destructive",
        });
      }
    }
    navigate("/");
  };

  // Redirect if no participant name
  useEffect(() => {
    if (!participantName) {
      navigate("/");
    }
  }, [participantName, navigate]);

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
  const currentVote = votes.find((v) => v.participantId === participantId);
  const isRevealed = votes.length > 0 ? votes[0].revealed : false;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <CardTitle className="text-2xl">{room.name}</CardTitle>
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm">
                      Room Details
                    </Button>
                  </DrawerTrigger>
                </Drawer>
              </div>

              <div className="flex items-center space-x-4">
                {/* Name editing */}
                <div className="flex items-center space-x-2">
                  {isEditingName ? (
                    <>
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRename()}
                        className="w-32"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleRename}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNewName(participantName);
                          setIsEditingName(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">
                        {currentParticipant?.name || participantName}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingName(true)}
                      >
                        Edit Name
                      </Button>
                    </>
                  )}
                </div>

                <Button variant="outline" onClick={handleLeaveRoom}>
                  Leave Room
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="min-h-screen">
          <ParticipantList roomId={roomId as Id<"rooms">} />

          <Card>
            <CardHeader>
              <CardTitle>Poker Voting</CardTitle>
            </CardHeader>
            <CardContent>
              <VotingPanel
                roomId={roomId as Id<"rooms">}
                participantId={participantId}
                currentVote={currentVote?.value || null}
                isRevealed={isRevealed}
              />
            </CardContent>
          </Card>
        </div>

        {/* Drawer for Room Controls and History */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent className="px-4 pb-8">
            <DrawerHeader>
              <DrawerTitle>Room Details</DrawerTitle>
            </DrawerHeader>

            <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto px-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Room Controls</h3>
                <RoomControls roomId={roomId as Id<"rooms">} />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Voting History</h3>
                <HistoryList roomId={roomId as Id<"rooms">} />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
