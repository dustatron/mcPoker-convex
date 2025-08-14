import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
  const [isResetting, setIsResetting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const { toast } = useToast();
  const voteStatus = useQuery(api.voting.getVoteStatus, { roomId });
  const room = useQuery(api.rooms.getRoom, { id: roomId });

  const toggleReveal = useMutation(api.voting.toggleReveal);
  const resetVotes = useMutation(api.voting.resetVotes);

  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}?room=${roomId}`
      : "";

  const handleToggleReveal = async () => {
    if (!voteStatus) return;

    setIsToggling(true);
    try {
      await toggleReveal({
        roomId,
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
    } finally {
      setIsToggling(false);
    }
  };

  const handleResetVotes = async () => {
    setIsResetting(true);
    try {
      await resetVotes({ roomId });

      toast({
        title: "Round Reset",
        description:
          "Votes have been saved to history and cleared for a new round",
      });
    } catch (error) {
      console.error("Failed to reset votes:", error);
      toast({
        title: "Error",
        description: "Failed to reset votes",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

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
        <CardTitle>Room Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Room Information */}
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Room Name
            </label>
            <p className="font-semibold">{room.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Room Link
            </label>
            <div className="flex space-x-2">
              <Input value={roomUrl} readOnly className="font-mono text-sm" />
              <Button onClick={handleCopyRoomLink} variant="outline" size="sm">
                Copy
              </Button>
            </div>
          </div>
        </div>

        {/* Vote Status */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm space-y-1">
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
                  voteStatus.revealed ? "text-green-600" : "text-cyan-600"
                }`}
              >
                {voteStatus.revealed ? "Revealed" : "Hidden"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleToggleReveal}
            disabled={isToggling || voteStatus.votedCount === 0}
            className="w-full"
            variant={voteStatus.revealed ? "outline" : "default"}
          >
            {isToggling
              ? "Updating..."
              : voteStatus.revealed
                ? "Hide Votes"
                : "Show Votes"}
          </Button>

          <Button
            onClick={handleResetVotes}
            disabled={isResetting || voteStatus.votedCount === 0}
            className="w-full"
            variant="outline"
          >
            {isResetting ? "Resetting..." : "Reset Round"}
          </Button>
        </div>

        {voteStatus.votedCount === 0 && (
          <p className="text-sm text-gray-500 text-center">
            No votes to show or reset yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
