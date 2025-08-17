import { useState } from "react";
import { Button } from "./ui/button";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useParams } from "react-router-dom";
import { saveRoomToHistory } from "@/pages/utils/saveRoomToHistory";
import { useToast } from "./ui/use-toast";

type RoomHeaderProps = {
  room: { name: string };
};

export function RoomHeader({ room }: RoomHeaderProps) {
  const [newRoomName, setNewRoomName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const { roomId } = useParams<{ roomId: string }>();
  const { toast } = useToast();

  const renameRoom = useMutation(api.rooms.renameRoom);

  const handleRoomRename = async () => {
    if (!roomId || newRoomName.trim() === room?.name) {
      setIsRenameDialogOpen(false);
      return;
    }

    setIsRenaming(true);
    try {
      await renameRoom({
        roomId: roomId as Id<"rooms">,
        newName: newRoomName.trim(),
      });

      // Update room in local history
      if (roomId) {
        saveRoomToHistory(roomId, newRoomName.trim());
      }

      setIsRenameDialogOpen(false);

      toast({
        title: "Room Renamed",
        description: `Room has been renamed to ${newRoomName.trim()}`,
      });
    } catch (error) {
      console.error("Failed to rename room:", error);
      toast({
        title: "Error",
        description: "Failed to rename room",
        variant: "destructive",
      });
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-foreground">
          {room.name.toLocaleUpperCase()}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="p-1"
          onClick={() => {
            setNewRoomName(room.name);
            setIsRenameDialogOpen(true);
          }}
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
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
            <path d="m15 5 4 4"></path>
          </svg>
        </Button>
      </div>
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Room</DialogTitle>
            <DialogDescription>
              Enter a new name for this room
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-y-4 py-4">
            <Input
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isRenaming) {
                  e.preventDefault();
                  handleRoomRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleRoomRename}
              disabled={
                isRenaming ||
                !newRoomName.trim() ||
                newRoomName.trim() === room?.name
              }
            >
              {isRenaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
