import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

interface ParticipantListProps {
  roomId: Id<"rooms">;
}

export function ParticipantList({ roomId }: ParticipantListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const { toast } = useToast();

  const participants = useQuery(api.participants.getParticipantsInRoom, {
    roomId,
  });
  const votes = useQuery(api.voting.getVotesInRoom, { roomId });
  const voteStatus = useQuery(api.voting.getVoteStatus, { roomId });

  const disconnectInactiveParticipants = useMutation(
    api.participants.disconnectInactiveParticipants,
  );

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-foreground">
            Participants
          </h3>
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Last refreshed: {formatLastRefresh(lastRefresh)}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {participants.map((participant) => {
          const status = getParticipantVoteStatus(participant._id);
          const value = getParticipantVoteValue(participant._id);

          return (
            <Card key={participant._id} className="p-4">
              <CardContent className="p-0 space-y-3">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      participant.connected
                        ? "bg-green-500"
                        : "bg-muted-foreground"
                    }`}
                  />
                  <span className="font-medium text-foreground truncate">
                    {participant.name}
                  </span>
                </div>

                <div className="flex justify-center">
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
                    <span className="text-lg font-bold text-primary bg-primary/10 px-3 py-2 rounded border-2 border-primary">
                      {value}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {participants.length === 0 && (
        <Card className="p-6">
          <p className="text-muted-foreground text-center">
            No participants yet
          </p>
        </Card>
      )}
    </div>
  );
}
