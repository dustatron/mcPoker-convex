import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { HistoryList } from "../components/HistoryList";
import { RoomControls } from "../components/RoomControls";
import { Button } from "../components/ui/button";
import { ParticipantCards } from "../components/ParticipantCards";
import { VoteResults } from "../components/VoteResults";
import { VoteDistribution } from "../components/VoteDistribution";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
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
  const [isToggling, setIsToggling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const { toast } = useToast();

  // Get vote status for the room
  const voteStatus = useQuery(api.voting.getVoteStatus, {
    roomId: roomId as Id<"rooms">,
  });

  // Mutations for vote controls
  const toggleReveal = useMutation(api.voting.toggleReveal);
  const resetVotes = useMutation(api.voting.resetVotes);
  const castVote = useMutation(api.voting.castVote);

  const room = useQuery(api.rooms.getRoom, { id: roomId as Id<"rooms"> });
  const participants = useQuery(api.participants.getParticipantsInRoom, {
    roomId: roomId as Id<"rooms">,
  });
  const votes = useQuery(api.voting.getVotesInRoom, {
    roomId: roomId as Id<"rooms">,
  });

  const joinRoom = useMutation(api.participants.joinRoom);
  const renameParticipant = useMutation(api.participants.renameParticipant);
  const renameRoom = useMutation(api.rooms.renameRoom);
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

  const handleRoomRename = async () => {
    if (!roomId || newRoomName.trim() === room?.name) {
      setIsRenameDialogOpen(false);
      return;
    }

    setIsRenaming(true);
    try {
      await renameRoom({
        roomId: roomId as Id<"rooms">,
        newName: newRoomName.trim(),
      });

      // Update room in local history
      if (roomId) {
        saveRoomToHistory(roomId, newRoomName.trim());
      }

      setIsRenameDialogOpen(false);

      toast({
        title: "Room Renamed",
        description: `Room has been renamed to ${newRoomName.trim()}`,
      });
    } catch (error) {
      console.error("Failed to rename room:", error);
      toast({
        title: "Error",
        description: "Failed to rename room",
        variant: "destructive",
      });
    } finally {
      setIsRenaming(false);
    }
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
        <div className="flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <Button variant={"blue"} onClick={() => setIsDrawerOpen(true)}>
              ⚙️
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {room.name.toLocaleUpperCase()}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                className="p-1"
                onClick={() => {
                  setNewRoomName(room.name);
                  setIsRenameDialogOpen(true);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                  <path d="m15 5 4 4"></path>
                </svg>
              </Button>
            </div>
          </div>

          {/* Session ID */}
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-md flex items-center gap-2">
            {/* Reveal Votes Button */}
            <Button
              onClick={async () => {
                if (!voteStatus) return;

                setIsToggling(true);
                try {
                  await toggleReveal({
                    roomId: roomId as Id<"rooms">,
                    revealed: !voteStatus.revealed,
                  });

                  toast({
                    title: voteStatus.revealed
                      ? "Votes Hidden"
                      : "Votes Revealed",
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
                } finally {
                  setIsToggling(false);
                }
              }}
              disabled={isToggling || voteStatus?.votedCount === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              {isToggling
                ? "Updating..."
                : voteStatus?.revealed
                  ? "Hide Votes"
                  : "Reveal Votes"}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Invite
            </Button>

            <Button
              onClick={async () => {
                setIsResetting(true);
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
                    description: "Failed to start new round",
                    variant: "destructive",
                  });
                } finally {
                  setIsResetting(false);
                }
              }}
              disabled={isResetting}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <svg
                className="mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                <path d="M16 21h5v-5"></path>
              </svg>
              Clear Votes
            </Button>

            {/* User Profile */}
            <div className="flex items-center gap-2 ml-2">
              <div className="bg-blue-600 dark:bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                {currentParticipant?.name?.substring(0, 2).toUpperCase() ||
                  "JD"}
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">
                  {currentParticipant?.name || participantName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1"
                  onClick={() => {
                    setNewName(currentParticipant?.name || participantName);
                    setIsEditingName(true);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                    <path d="m15 5 4 4"></path>
                  </svg>
                </Button>
              </div>
            </div>
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

            {/* Participant Cards */}
            <ParticipantCards
              participants={participants}
              votes={votes}
              voteStatus={voteStatus}
            />
            <div className="flex justify-between flex-shrink-0 w-full mt-4">
              {/* Vote Results Section */}
              <VoteResults
                votes={votes}
                revealed={voteStatus?.revealed || false}
                votedCount={voteStatus?.votedCount || 0}
              />
              {/* Vote Distribution Chart */}
              <VoteDistribution
                votes={votes}
                revealed={voteStatus?.revealed || false}
                votedCount={voteStatus?.votedCount || 0}
              />
            </div>
          </div>

          {/* Right Column - Voting */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Cast Your Vote
            </h2>

            {/* Voting Cards Grid */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {/* Numeric Vote Options */}
              {[0, 1, 2, 3, 5, 8, 13, 21, "?"].map((value) => {
                const stringValue = value.toString();
                const numValue = value === "?" ? null : Number(value);
                const isSelected = currentVote?.value === numValue;

                return (
                  <button
                    key={stringValue}
                    onClick={async () => {
                      try {
                        await castVote({
                          roomId: roomId as Id<"rooms">,
                          participantId,
                          value: numValue,
                        });
                      } catch (error) {
                        console.error("Failed to cast vote:", error);
                        toast({
                          title: "Error",
                          description: "Failed to cast vote",
                          variant: "destructive",
                        });
                      }
                    }}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center text-2xl font-bold
                      ${
                        isSelected
                          ? "bg-blue-600 dark:bg-blue-500 text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-blue-300 dark:hover:border-blue-600"
                      }
                    `}
                  >
                    {stringValue}
                  </button>
                );
              })}

              {/* Pass Option */}
              <button
                onClick={async () => {
                  try {
                    await castVote({
                      roomId: roomId as Id<"rooms">,
                      participantId,
                      value: -1, // Using -1 to represent "Pass"
                    });
                  } catch (error) {
                    console.error("Failed to cast vote:", error);
                    toast({
                      title: "Error",
                      description: "Failed to cast vote",
                      variant: "destructive",
                    });
                  }
                }}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-lg font-medium
                  ${
                    currentVote?.value === -1
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-blue-300 dark:hover:border-blue-600"
                  }
                `}
              >
                Pass
              </button>
            </div>
          </div>
        </div>

        {/* Drawer for Room Controls and History */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent className="px-4 pb-8">
            <DrawerHeader>
              <DrawerTitle className="text-foreground">
                Room Details
              </DrawerTitle>
            </DrawerHeader>

            <div className="flex flex-row  mt-4 max-h-[80vh]  overflow-y-auto space-x-4">
              <div className="w-2/3">
                <HistoryList roomId={roomId as Id<"rooms">} />
              </div>
              <div className="mb-2 w-1/3">
                <RoomControls roomId={roomId as Id<"rooms">} />
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Rename Room Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename Room</DialogTitle>
              <DialogDescription>
                Enter a new name for this room
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-y-4 py-4">
              <Input
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isRenaming) {
                    e.preventDefault();
                    handleRoomRename();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsRenameDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleRoomRename}
                disabled={
                  isRenaming ||
                  !newRoomName.trim() ||
                  newRoomName.trim() === room?.name
                }
              >
                {isRenaming ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Username Change Dialog */}
        <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change Your Name</DialogTitle>
              <DialogDescription>
                Enter your new display name below.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-y-4 py-4">
              <Input
                placeholder="Enter your new name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setIsEditingName(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                disabled={!newName.trim() || newName.trim() === participantName}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
