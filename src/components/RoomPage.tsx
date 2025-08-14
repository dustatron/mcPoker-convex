import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ParticipantList } from "./ParticipantList";
import { VotingPanel } from "./VoteButton";
import { HistoryList } from "./HistoryList";
import { RoomControls } from "./RoomControls";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "./ui/use-toast";

interface RoomPageProps {
  roomId: Id<"rooms">;
  participantName: string;
  onLeaveRoom: () => void;
}

export function RoomPage({
  roomId,
  participantName,
  onLeaveRoom,
}: RoomPageProps) {
  const [participantId, setParticipantId] = useState<Id<"participants"> | null>(
    null,
  );
  const [isJoining, setIsJoining] = useState(true);
  const [newName, setNewName] = useState(participantName);
  const [isEditingName, setIsEditingName] = useState(false);

  const { toast } = useToast();

  const room = useQuery(api.rooms.getRoom, { id: roomId });
  const participants = useQuery(api.participants.getParticipantsInRoom, {
    roomId,
  });
  const votes = useQuery(api.voting.getVotesInRoom, { roomId });

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
        const id = await joinRoom({ roomId, name: participantName });
        setParticipantId(id);
        setIsJoining(false);

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

    if (room && !participantId) {
      joinRoomAsync();
    }
  }, [room, participantId, joinRoom, roomId, participantName, toast]);

  // Heartbeat to maintain connection
  useEffect(() => {
    if (!participantId) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        await updateHeartbeat({ participantId });
        await updateRoomActivity({ roomId });
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
    onLeaveRoom();
  };

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
              <div>
                <CardTitle className="text-2xl">{room.name}</CardTitle>
                <p className="text-muted-foreground mt-1">Room ID: {roomId}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Participants & Voting */}
          <div className="lg:col-span-2 space-y-6">
            <ParticipantList roomId={roomId} />

            <Card>
              <CardHeader>
                <CardTitle>Poker Voting</CardTitle>
              </CardHeader>
              <CardContent>
                <VotingPanel
                  roomId={roomId}
                  participantId={participantId}
                  currentVote={currentVote?.value || null}
                  isRevealed={isRevealed}
                />
              </CardContent>
            </Card>

            <HistoryList roomId={roomId} />
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-6">
            <RoomControls roomId={roomId} />
          </div>
        </div>
      </div>
    </div>
  );
}
