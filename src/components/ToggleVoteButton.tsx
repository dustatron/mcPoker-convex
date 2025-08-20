import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useParams } from "react-router-dom";

export function ToggleVoteButton() {
  const { roomId } = useParams<{ roomId: string }>();
  const voteStatus = useQuery(api.voting.getVoteStatus, {
    roomId: roomId as Id<"rooms">,
  });

  const [isToggling, setIsToggling] = useState(false);
  const toggleReveal = useMutation(api.voting.toggleReveal);

  const { toast } = useToast();

  return (
    <div className="">
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
        }}
        disabled={isToggling || voteStatus?.votedCount === 0}
        // variant={voteStatus?.revealed ? "default" : "blue"}
        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
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
          className="mr-2"
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
  );
}
