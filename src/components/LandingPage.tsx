import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface LandingPageProps {
  onJoinRoom: (roomId: Id<"rooms">, participantName: string) => void;
}

export function LandingPage({ onJoinRoom }: LandingPageProps) {
  const [participantName, setParticipantName] = useState(
    localStorage.getItem("mcPoker_participantName") || "",
  );
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const createRoom = useMutation(api.rooms.createRoom);

  const handleCreateRoom = async () => {
    if (!participantName.trim() || !roomName.trim()) return;

    setIsCreating(true);
    try {
      const newRoomId = await createRoom({ name: roomName });
      localStorage.setItem("mcPoker_participantName", participantName);
      onJoinRoom(newRoomId, participantName);
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!participantName.trim() || !roomId.trim()) return;

    setIsJoining(true);
    localStorage.setItem("mcPoker_participantName", participantName);
    onJoinRoom(roomId as Id<"rooms">, participantName);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">McPoker</h1>
          <p className="text-muted-foreground mt-2">
            Agile Poker Planning Made Simple
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Name</CardTitle>
            <CardDescription>
              Enter your name to participate in voting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Enter your name"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create New Room</CardTitle>
            <CardDescription>
              Start a new poker planning session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="Room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <Button
              onClick={handleCreateRoom}
              disabled={
                !participantName.trim() || !roomName.trim() || isCreating
              }
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Room"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Join Existing Room</CardTitle>
            <CardDescription>Join a room using its ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <Button
              onClick={handleJoinRoom}
              disabled={!participantName.trim() || !roomId.trim() || isJoining}
              className="w-full"
              variant="outline"
            >
              {isJoining ? "Joining..." : "Join Room"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
