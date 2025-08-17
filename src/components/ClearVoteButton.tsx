import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

type Props = {
  roomId?: string;
};

export function ClearVoteButton({ roomId }: Props) {
  const [isResetting, setIsResetting] = useState(false);
  const resetVotes = useMutation(api.voting.resetVotes);

  const { toast } = useToast();
  return (
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
  );
}
