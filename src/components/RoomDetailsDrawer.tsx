import { Id } from "convex/_generated/dataModel";
import { HistoryList } from "./HistoryList";
import { RoomControls } from "./RoomControls";
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
          <DrawerHeader>
            <DrawerTitle className="text-foreground dark:text-white">
              Room Details
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-row mt-4 max-h-[80vh] overflow-y-auto space-x-4 dark:text-gray-200">
            <div className="w-2/3">
              <HistoryList roomId={roomId as Id<"rooms">} />
            </div>
            <div className="mb-2 w-1/3">
              <RoomControls roomId={roomId as Id<"rooms">} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
