import { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

import { useParams } from "react-router-dom";
import { useToast } from "./ui/use-toast";

type Props = {
  participantId: Id<"participants">;
};
export function VoteCardGrid({ participantId }: Props) {
  const { toast } = useToast();
  const { roomId } = useParams<{ roomId: string }>();
  const castVote = useMutation(api.voting.castVote);

  const votes = useQuery(api.voting.getVotesInRoom, {
    roomId: roomId as Id<"rooms">,
  });

  const currentVote = votes?.find((v) => v.participantId === participantId);
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-foreground">
        Cast Your Vote
      </h2>
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
  );
}
