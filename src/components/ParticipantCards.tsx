import { Id } from "../../convex/_generated/dataModel";

interface Participant {
  _id: Id<"participants">;
  name: string;
  connected: boolean;
  lastSeen: number;
}

interface Vote {
  _id: string;
  roomId: string;
  participantId: string;
  value: number | null;
  revealed: boolean;
}

interface ParticipantCardsProps {
  participants: Participant[];
  votes: Vote[];
  voteStatus:
    | {
        totalParticipants?: number;
        votedCount?: number;
        revealed: boolean;
        allVoted?: boolean;
      }
    | null
    | undefined;
}

// Function to generate consistent colors based on participant name
const getParticipantColor = (name: string) => {
  // Simple hash function to generate a number from a string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert to hex color
  const colors = [
    "#4F46E5", // indigo
    "#0EA5E9", // sky
    "#10B981", // emerald
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // violet
    "#EC4899", // pink
    "#06B6D4", // cyan
  ];

  // Use the hash to pick a color from our palette
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export function ParticipantCards({
  participants,
  votes,
  voteStatus,
}: ParticipantCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {participants.map((participant) => {
        const vote = votes.find((v) => v.participantId === participant._id);
        const hasVoted = vote && vote.value !== null;
        const voteValue = vote?.value;
        const isVoteRevealed = hasVoted && voteStatus?.revealed;

        return (
          <div
            key={participant._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{
                  backgroundColor: getParticipantColor(participant.name),
                }}
              >
                {participant.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {participant.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {hasVoted ? "Voted" : "Waiting"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center w-12 h-12">
              {isVoteRevealed && voteValue !== null ? (
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {voteValue}
                </span>
              ) : hasVoted ? (
                <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                  ?
                </span>
              ) : (
                <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                  -
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
