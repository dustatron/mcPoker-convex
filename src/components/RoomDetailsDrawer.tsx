import { Id } from "convex/_generated/dataModel";
import { HistoryList } from "./HistoryList";
import { RoomControls } from "./RoomControls";
import { ParticipantList } from "./ParticipantList";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { useState } from "react";
import { Button } from "./ui/button";
import { useParams } from "react-router-dom";

export function RoomDetailsDrawer() {
  const { roomId } = useParams<{ roomId: string }>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <Button variant={"blue"} onClick={() => setIsDrawerOpen(true)}>
        ⚙️
      </Button>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="px-4 pb-8 dark:bg-gray-900 dark:border-gray-800">
          <DrawerHeader className="relative">
            <DrawerTitle className="text-foreground dark:text-white">
              Room Details
            </DrawerTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-0 right-0 h-8 w-8 p-0 rounded-full"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close drawer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500 dark:text-gray-400"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </Button>
          </DrawerHeader>

          <div className="flex flex-row mt-4 max-h-[80vh] overflow-y-auto space-x-4 dark:text-gray-200">
            <div className="w-1/3">
              <HistoryList roomId={roomId as Id<"rooms">} />
            </div>
            <div className="mb-2 w-1/3">
              <RoomControls roomId={roomId as Id<"rooms">} />
            </div>
            <div className="mb-2 w-1/3">
              <ParticipantList roomId={roomId as Id<"rooms">} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
