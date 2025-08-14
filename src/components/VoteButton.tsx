import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";

interface VoteButtonProps {
  value: number;
  isSelected: boolean;
  isRevealed: boolean;
  roomId: Id<"rooms">;
  participantId: Id<"participants">;
  disabled?: boolean;
}

export function VoteButton({
  value,
  isSelected,
  isRevealed,
  roomId,
  participantId,
  disabled,
}: VoteButtonProps) {
  const castVote = useMutation(api.voting.castVote);

  const handleVote = async () => {
    if (disabled) return;

    try {
      await castVote({
        roomId,
        participantId,
        value: isSelected ? null : value, // Toggle vote - unselect if already selected
      });
    } catch (error) {
      console.error("Failed to cast vote:", error);
    }
  };

  return (
    <Button
      onClick={handleVote}
      disabled={disabled}
      variant={isSelected ? "default" : "outline"}
      size="lg"
      className={`
        min-w-[60px] h-16 text-lg font-bold
        ${
          isSelected
            ? "bg-cyan-500 hover:bg-cyan-600 text-white"
            : "hover:bg-cyan-50 hover:border-cyan-300"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {value}
    </Button>
  );
}

interface VotingPanelProps {
  roomId: Id<"rooms">;
  participantId: Id<"participants">;
  currentVote: number | null;
  isRevealed: boolean;
  disabled?: boolean;
}

export function VotingPanel({
  roomId,
  participantId,
  currentVote,
  isRevealed,
  disabled,
}: VotingPanelProps) {
  const pokerValues = [1, 2, 3, 5, 8, 13];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Cast Your Vote</h3>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {pokerValues.map((value) => (
          <VoteButton
            key={value}
            value={value}
            isSelected={currentVote === value}
            isRevealed={isRevealed}
            roomId={roomId}
            participantId={participantId}
            disabled={disabled}
          />
        ))}
      </div>

      {currentVote !== null && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Your vote:{" "}
            <span className="font-bold text-cyan-600">{currentVote}</span>
            {!isRevealed && <span className="text-gray-500"> (hidden)</span>}
          </p>
        </div>
      )}
    </div>
  );
}
