interface Vote {
  _id: string;
  roomId: string;
  participantId: string;
  value: number | null;
  revealed: boolean;
}

interface VoteResultsProps {
  votes: Vote[];
  revealed: boolean;
  votedCount: number;
}

export function VoteResults({ votes, revealed, votedCount }: VoteResultsProps) {
  if (!revealed || votedCount === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow  p-4 mb-6 h-full">
      <h3 className="text-md font-semibold mb-3 flex items-center">
        <svg
          className="mr-2 h-5 w-5"
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
          <path d="M3 3v18h18"></path>
          <path d="M18 12V8"></path>
          <path d="M14 12V6"></path>
          <path d="M10 12v-2"></path>
          <path d="M6 12v-4"></path>
        </svg>
        <span className="text-foreground">Vote Results</span>
      </h3>

      <div className="grid grid-cols-3 gap-4 text-center h-full items-center">
        {/* Calculate consensus (most common vote) */}
        {(() => {
          const voteValues = votes
            .filter((v) => v.value !== null && v.value !== -1)
            .map((v) => v.value);

          if (voteValues.length === 0) return null;

          const counts: Record<number, number> = {};
          let maxCount = 0;
          let consensus = 0;

          voteValues.forEach((value) => {
            if (value === null) return;
            counts[value as number] = (counts[value as number] || 0) + 1;
            if (counts[value as number] > maxCount) {
              maxCount = counts[value as number];
              consensus = value as number;
            }
          });

          return (
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {consensus}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Consensus
              </span>
            </div>
          );
        })()}

        {/* Calculate agreement (percentage of votes that match consensus) */}
        {(() => {
          const voteValues = votes
            .filter((v) => v.value !== null && v.value !== -1)
            .map((v) => v.value);

          if (voteValues.length === 0) return null;

          const counts: Record<number, number> = {};
          let maxCount = 0;

          voteValues.forEach((value) => {
            if (value === null) return;
            counts[value as number] = (counts[value as number] || 0) + 1;
            if (counts[value as number] > maxCount) {
              maxCount = counts[value as number];
            }
          });

          const agreement = Math.round((maxCount / voteValues.length) * 100);

          return (
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {agreement}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Agreement
              </span>
            </div>
          );
        })()}

        {/* Calculate average */}
        {(() => {
          const voteValues = votes
            .filter(
              (v) =>
                v.value !== null &&
                v.value !== -1 &&
                typeof v.value === "number",
            )
            .map((v) => v.value as number);

          if (voteValues.length === 0) return null;

          const sum = voteValues.reduce((acc, val) => acc + val, 0);
          const average = Math.round((sum / voteValues.length) * 10) / 10;

          return (
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {average}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Average
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
