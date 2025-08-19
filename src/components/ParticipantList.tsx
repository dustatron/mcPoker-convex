import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

interface ParticipantListProps {
  roomId: Id<"rooms">;
}

export function ParticipantList({ roomId }: ParticipantListProps) {
  // Get current participant ID from localStorage
  const currentParticipantId = localStorage.getItem(
    "mcPoker_participantId",
  ) as Id<"participants"> | null;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [removingParticipantId, setRemovingParticipantId] =
    useState<Id<"participants"> | null>(null);

  const { toast } = useToast();

  const participants = useQuery(api.participants.getParticipantsInRoom, {
    roomId,
  });
  const votes = useQuery(api.voting.getVotesInRoom, { roomId });
  const voteStatus = useQuery(api.voting.getVoteStatus, { roomId });

  const disconnectInactiveParticipants = useMutation(
    api.participants.disconnectInactiveParticipants,
  );

  const leaveRoom = useMutation(api.participants.leaveRoom);

  if (!participants || !votes || !voteStatus) {
    return <div>Loading participants...</div>;
  }

  const getParticipantVoteStatus = (participantId: Id<"participants">) => {
    const vote = votes.find((v) => v.participantId === participantId);
    if (!vote || vote.value === null) return "not-voted";
    if (vote.revealed) return "revealed";
    return "voted";
  };

  const getParticipantVoteValue = (participantId: Id<"participants">) => {
    const vote = votes.find((v) => v.participantId === participantId);
    return vote?.value;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await disconnectInactiveParticipants({
        timeoutMinutes: 2, // More aggressive cleanup - 2 minutes of inactivity
      });

      setLastRefresh(new Date());

      if (result.disconnectedCount > 0) {
        toast({
          title: "Participants Updated",
          description: `Removed ${result.disconnectedCount} inactive participant${result.disconnectedCount === 1 ? "" : "s"}`,
        });
      } else {
        toast({
          title: "Participants Refreshed",
          description: "All participants are active",
        });
      }
    } catch (error) {
      console.error("Failed to refresh participants:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh participant list",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRemoveParticipant = async (
    participantId: Id<"participants">,
    participantName: string,
  ) => {
    const isCurrentUser = participantId === currentParticipantId;
    const confirmMessage = isCurrentUser
      ? `Are you sure you want to leave the room?`
      : `Are you sure you want to remove ${participantName} from the room?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setRemovingParticipantId(participantId);

    try {
      await leaveRoom({ participantId });

      const isCurrentUser = participantId === currentParticipantId;

      toast({
        title: isCurrentUser ? "Left Room" : "Participant Removed",
        description: isCurrentUser
          ? "You have left the room"
          : `${participantName} has been removed from the room`,
      });

      // If current user is leaving, redirect to home page
      if (isCurrentUser) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Failed to remove participant:", error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove participant from the room",
        variant: "destructive",
      });
    } finally {
      setRemovingParticipantId(null);
    }
  };

  const formatLastRefresh = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle> Participants</CardTitle>
          <div>{lastRefresh && formatLastRefresh(lastRefresh)}</div>
          <div className="flex justify-between items-center space-x-3">
            <span className="text-sm font-normal text-muted-foreground">
              {voteStatus.votedCount}/{voteStatus.totalParticipants} voted
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs"
            >
              {isRefreshing ? "Refreshing..." : "↻ Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {participants.map((participant) => {
            const status = getParticipantVoteStatus(participant._id);
            const value = getParticipantVoteValue(participant._id);
            const isCurrentUser = participant._id === currentParticipantId;

            return (
              <div
                key={participant._id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg dark:border dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      participant.connected
                        ? "bg-green-500"
                        : "bg-muted-foreground"
                    }`}
                  />
                  <span
                    className="font-medium text-foreground"
                    title={participant.name}
                  >
                    {participant.name.length > 15
                      ? `${participant.name.substring(0, 15)}...`
                      : participant.name}
                  </span>

                  <div className="ml-3">
                    {status === "not-voted" && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Not voted
                      </span>
                    )}
                    {status === "voted" && (
                      <span className="text-xs text-primary-foreground bg-primary px-2 py-1 rounded">
                        Voted
                      </span>
                    )}
                    {status === "revealed" && value !== null && (
                      <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary">
                        {value}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant={isCurrentUser ? "outline" : "destructive"}
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    handleRemoveParticipant(participant._id, participant.name)
                  }
                  disabled={removingParticipantId === participant._id}
                >
                  {removingParticipantId === participant._id
                    ? isCurrentUser
                      ? "Leaving..."
                      : "Removing..."
                    : isCurrentUser
                      ? "Leave"
                      : "Remove"}
                </Button>
              </div>
            );
          })}

          {participants.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              No participants yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
