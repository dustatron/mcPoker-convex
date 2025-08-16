import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface HistoryListProps {
  roomId: Id<"rooms">;
}

export function HistoryList({ roomId }: HistoryListProps) {
  const history = useQuery(api.history.getHistory, { roomId });

  if (!history) {
    return <div>Loading history...</div>;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const calculateAverage = (votes: Array<{ name: string; value: number }>) => {
    if (votes.length === 0) return 0;
    const sum = votes.reduce((acc, vote) => acc + vote.value, 0);
    return (sum / votes.length).toFixed(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voting History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No voting history yet
            </p>
          ) : (
            history.map((round) => (
              <div
                key={round._id}
                className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold dark:text-white">
                    Round {round.roundNumber}
                  </h4>
                  <div className="text-right text-sm text-gray-500 dark:text-gray-300">
                    <div>{formatDate(round.createdAt)}</div>
                    <div className="font-medium text-cyan-600 dark:text-cyan-400">
                      Avg: {calculateAverage(round.votes)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {round.votes.map((vote, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded border dark:border-gray-600"
                    >
                      <span className="text-sm font-medium dark:text-gray-200">
                        {vote.name}
                      </span>
                      <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                        {vote.value}
                      </span>
                    </div>
                  ))}
                </div>

                {round.votes.length === 0 && (
                  <p className="text-gray-400 dark:text-gray-400 text-sm">
                    No votes in this round
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
