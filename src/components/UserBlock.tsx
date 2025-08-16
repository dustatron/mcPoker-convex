import { Button } from "./ui/button";

type UserBlockProps = {
  currentParticipantName?: string;
  participantName: string;
  setNewName: (name: string) => void;
  setIsEditingName: (state: boolean) => void;
};

export function UserBlock({
  participantName,
  setIsEditingName,
  setNewName,
  currentParticipantName,
}: UserBlockProps) {
  {
    /* User Profile */
  }
  return (
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
  );
}
