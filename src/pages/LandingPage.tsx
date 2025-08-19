import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

// Define the RoomHistory interface
interface RoomHistoryItem {
  id: string;
  name: string;
  timestamp: number;
}

// Functions to manage room history in localStorage
const saveRoomToHistory = (id: string, name: string) => {
  try {
    // Get existing history or initialize empty array
    const historyJson = localStorage.getItem("mcPoker_roomHistory");
    const history: RoomHistoryItem[] = historyJson
      ? JSON.parse(historyJson)
      : [];

    // Check if room already exists in history
    const existingIndex = history.findIndex((item) => item.id === id);

    // Create new history item
    const historyItem: RoomHistoryItem = {
      id,
      name,
      timestamp: Date.now(),
    };

    // If room exists, update it; otherwise add to history
    if (existingIndex !== -1) {
      history[existingIndex] = historyItem;
    } else {
      // Add new room to history
      history.unshift(historyItem);

      // Keep only the most recent 10 rooms
      if (history.length > 10) {
        history.pop();
      }
    }

    // Save updated history back to localStorage
    localStorage.setItem("mcPoker_roomHistory", JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save room to history:", error);
  }
};

const getRoomHistory = (): RoomHistoryItem[] => {
  try {
    const historyJson = localStorage.getItem("mcPoker_roomHistory");
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error("Failed to get room history:", error);
    return [];
  }
};

export function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [participantName, setParticipantName] = useState(
    localStorage.getItem("mcPoker_participantName") || "",
  );
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState(searchParams.get("room"));
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomHistory, setRoomHistory] = useState<RoomHistoryItem[]>([]);

  const createRoom = useMutation(api.rooms.createRoom);

  // Load room history on component mount
  useEffect(() => {
    setRoomHistory(getRoomHistory());
  }, []);

  const handleCreateRoom = async () => {
    if (!participantName.trim() || !roomName.trim()) return;

    setIsCreating(true);
    try {
      const newRoomId = await createRoom({ name: roomName });
      localStorage.setItem("mcPoker_participantName", participantName);

      // Save room to history
      saveRoomToHistory(newRoomId, roomName);

      navigate(`/room/${newRoomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!participantName.trim() || !roomId?.trim()) return;

    setIsJoining(true);
    localStorage.setItem("mcPoker_participantName", participantName);

    // Save room to history with a generic name
    saveRoomToHistory(roomId, `Room ${roomId}`);

    // Navigate to the room
    navigate(`/room/${roomId}`);
  };

  const handleJoinHistoryRoom = (historyItem: RoomHistoryItem) => {
    if (!participantName.trim()) return;

    localStorage.setItem("mcPoker_participantName", participantName);
    navigate(`/room/${historyItem.id}`);
  };

  return (
    <div className="container lg:w-2/4 md:mx-auto   px-4 my-10">
      <Card>
        <CardHeader>
          <div className="text-center">
            <p className="h2 font-bold text-lg">
              Point your tickets the easy way
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Card className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg dark:border dark:border-gray-700">
              <CardHeader>
                <CardTitle>Your Name</CardTitle>
                <CardDescription>
                  Enter your name to participate in voting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={participantName}
                  onChange={(e) =>
                    setParticipantName(e.target.value.slice(0, 16))
                  }
                  maxLength={16}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum 16 characters
                </p>
              </CardContent>
            </Card>
            {!roomId && (
              <Card className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg dark:border dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Create New Room</CardTitle>
                  <CardDescription>
                    Start a new poker planning session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg dark:border dark:border-gray-700 flex-col">
                  <Input
                    type="text"
                    placeholder="Room name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value.slice(0, 40))}
                    maxLength={40}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 40 characters
                  </p>
                  <Button
                    onClick={handleCreateRoom}
                    disabled={
                      !participantName.trim() || !roomName.trim() || isCreating
                    }
                    className="w-full"
                  >
                    {isCreating ? "Creating..." : "Create Room"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {roomId && (
              <Card className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg dark:border dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Join Existing Room</CardTitle>
                  <CardDescription>Join a room using its ID</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                  <Button
                    onClick={handleJoinRoom}
                    disabled={
                      !participantName.trim() || !roomId.trim() || isJoining
                    }
                    className="w-full"
                    variant="outline"
                  >
                    {isJoining ? "Joining..." : "Join Room"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Room History */}
            {!roomId && roomHistory.length > 0 && (
              <Card className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg dark:border dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Recently Visited Rooms</CardTitle>
                  <CardDescription>
                    Quick access to your recent rooms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {roomHistory.map((historyItem) => (
                      <div
                        key={historyItem.id}
                        className="flex justify-between items-center p-3 bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleJoinHistoryRoom(historyItem)}
                      >
                        <div>
                          <div className="font-medium dark:text-white">
                            {historyItem.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {historyItem.id}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
