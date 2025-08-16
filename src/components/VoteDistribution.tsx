interface Vote {
  _id: string;
  roomId: string;
  participantId: string;
  value: number | null;
  revealed: boolean;
}

interface VoteDistributionProps {
  votes: Vote[];
  revealed: boolean;
  votedCount: number;
}

export function VoteDistribution({
  votes,
  revealed,
  votedCount,
}: VoteDistributionProps) {
  if (!revealed || votedCount === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-md font-semibold mb-3 text-foreground">
        Vote Distribution
      </h3>

      <div className="space-y-2">
        {(() => {
          const voteValues = votes
            .filter((v) => v.value !== null && v.value !== -1)
            .map((v) => v.value);

          if (voteValues.length === 0)
            return (
              <p className="text-gray-500 dark:text-gray-400">
                No votes to display
              </p>
            );

          const counts: Record<number, number> = {};
          const possibleValues = [0, 1, 2, 3, 5, 8, 13, 21];

          voteValues.forEach((value) => {
            if (value === null) return;
            counts[value as number] = (counts[value as number] || 0) + 1;
          });

          const maxCount = Math.max(...Object.values(counts));

          return (
            <div className="space-y-2">
              {possibleValues.map((value) => {
                const count = counts[value] || 0;
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div key={value} className="flex items-center gap-2">
                    <div className="w-8 text-center font-medium text-foreground">
                      {value}
                    </div>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-full rounded-full flex items-center justify-start pl-2 text-white text-xs"
                        style={{
                          width: `${percentage}%`,
                          minWidth: count > 0 ? "2rem" : "0",
                        }}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
