import { useState, useEffect } from "react";
import { Layout } from "@/Layout";
import { LandingPage } from "@/components/LandingPage";
import { RoomPage } from "@/components/RoomPage";
import { Toaster } from "@/components/ui/toaster";
import { Id } from "../convex/_generated/dataModel";

type AppState =
  | { type: "landing" }
  | { type: "room"; roomId: Id<"rooms">; participantName: string };

export default function App() {
  const [appState, setAppState] = useState<AppState>({ type: "landing" });

  // Handle URL parameters on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");
    const savedName = localStorage.getItem("mcPoker_participantName");

    if (roomParam && savedName) {
      setAppState({
        type: "room",
        roomId: roomParam as Id<"rooms">,
        participantName: savedName,
      });
    }
  }, []);

  const handleJoinRoom = (roomId: Id<"rooms">, participantName: string) => {
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    window.history.pushState({}, "", url.toString());

    setAppState({
      type: "room",
      roomId,
      participantName,
    });
  };

  const handleLeaveRoom = () => {
    // Clear URL parameters
    const url = new URL(window.location.href);
    url.searchParams.delete("room");
    window.history.pushState({}, "", url.toString());

    setAppState({ type: "landing" });
  };

  return (
    <Layout menu={<div className="text-sm text-gray-600">McPoker v1.0</div>}>
      <>
        {appState.type === "landing" && (
          <LandingPage onJoinRoom={handleJoinRoom} />
        )}

        {appState.type === "room" && (
          <RoomPage
            roomId={appState.roomId}
            participantName={appState.participantName}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        <Toaster />
      </>
    </Layout>
  );
}
