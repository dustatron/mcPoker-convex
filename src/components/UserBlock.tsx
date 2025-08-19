import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useToast } from "./ui/use-toast";

type UserBlockProps = {
  currentParticipantName?: string;
  participantId: Id<"participants"> | null;
};

export function UserBlock({
  currentParticipantName,
  participantId,
}: UserBlockProps) {
  const renameParticipant = useMutation(api.participants.renameParticipant);
  const [participantName, setParticipantName] = useState<string>(
    localStorage.getItem("mcPoker_participantName") || "",
  );
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(participantName);

  const handleRename = async () => {
    if (!participantId || newName.trim() === participantName) {
      setIsEditingName(false);
      return;
    }

    try {
      await renameParticipant({ participantId, newName: newName.trim() });
      localStorage.setItem("mcPoker_participantName", newName.trim());
      setParticipantName(newName.trim());
      setIsEditingName(false);

      toast({
        title: "Name Updated",
        description: `Your name has been changed to ${newName.trim()}`,
      });
    } catch (error) {
      console.error("Failed to rename:", error);
      toast({
        title: "Error",
        description: "Failed to update name",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 ml-2">
        <div className="bg-blue-600 dark:bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
          {/* {currentParticipant?.name?.substring(0, 2).toUpperCase() || "JD"} */}
          {currentParticipantName?.substring(0, 2).toUpperCase() || "JD"}
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium text-foreground">
            {currentParticipantName || participantName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={() => {
              setNewName(currentParticipantName || participantName);
              setIsEditingName(true);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
      </div>
      <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Your Name</DialogTitle>
            <DialogDescription>
              Enter your new display name below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-y-4 py-4 flex-col">
            <Input
              placeholder="Enter your new name"
              value={newName}
              onChange={(e) => setNewName(e.target.value.slice(0, 16))}
              maxLength={16}
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum 16 characters
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsEditingName(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newName.trim() || newName.trim() === participantName}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
