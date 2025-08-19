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
            <div className="flex justify-between h-28 items-end space-x-4">
              {possibleValues.map((value) => {
                const count = counts[value] || 0;
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div
                    key={value}
                    className="flex flex-col items-center gap-1 h-full"
                  >
                    <div className="w-8 flex-grow flex flex-col-reverse justify-start items-center">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 w-8 rounded-t-lg flex items-end justify-center pb-1 text-white text-xs"
                        style={{
                          height: `${percentage}%`,
                          minHeight: count > 0 ? "2rem" : "0",
                        }}
                      >
                        {count > 0 ? count : ""}
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 w-8 rounded-t-lg flex-grow"></div>
                    </div>
                    <div className="text-center font-medium text-foreground">
                      {value}
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
