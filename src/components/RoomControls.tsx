import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { useToast } from "./ui/use-toast";

interface RoomControlsProps {
  roomId: Id<"rooms">;
}

export function RoomControls({ roomId }: RoomControlsProps) {
  const { toast } = useToast();
  const voteStatus = useQuery(api.voting.getVoteStatus, { roomId });
  const room = useQuery(api.rooms.getRoom, { id: roomId });

  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}?room=${roomId}`
      : "";

  const handleCopyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      toast({
        title: "Copied!",
        description: "Room link copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Error",
        description: "Failed to copy room link",
        variant: "destructive",
      });
    }
  };

  if (!voteStatus || !room) {
    return <div>Loading controls...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Detaild</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Room Information */}
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Room Name
            </label>
            <p className="font-semibold dark:text-white">{room.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Room Link
            </label>
            <div className="flex space-x-2 flew-col">
              <Input value={roomUrl} readOnly className="font-mono text-sm" />
              <Button onClick={handleCopyRoomLink} variant="outline" size="sm">
                Copy
              </Button>
            </div>
          </div>
        </div>

        {/* Vote Status */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg dark:border dark:border-gray-700">
          <div className="text-sm space-y-1 dark:text-gray-200">
            <div className="flex justify-between">
              <span>Participants:</span>
              <span className="font-medium">
                {voteStatus.totalParticipants}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Voted:</span>
              <span className="font-medium">{voteStatus.votedCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={`font-medium ${
                  voteStatus.revealed
                    ? "text-green-600 dark:text-green-400"
                    : "text-cyan-600 dark:text-cyan-400"
                }`}
              >
                {voteStatus.revealed ? "Revealed" : "Hidden"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
