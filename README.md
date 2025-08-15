# Agile Poker Voting Tool

This project implements a real-time Agile Poker voting tool, designed for teams to estimate tasks efficiently. It leverages Convex for real-time data synchronization and persistence.

## Features

*   **Real-time Voting:** Participants can vote and change their votes in real-time.
*   **Hidden Votes:** Votes remain hidden until explicitly revealed by any participant.
*   **Flexible Control:** Any participant can show/hide votes or reset the round.
*   **Persistent Rooms:** Each team gets a permanent, shareable room link. Rooms persist indefinitely unless all participants leave for 24 hours.
*   **Room History:** Stores up to 99 past rounds, including final revealed votes and who voted what.
*   **Participant Management:** Live list of connected participants, showing their voting status.
*   **Simple Joining:** Join by entering a name; name is saved locally for convenience.
*   **Standard Scale:** Uses a fixed Agile Poker scale (e.g., 1, 2, 3, 5, 8, 13).

## Get Started

To run this project locally:

1.  **Install dependencies:**
    ```sh
    npm install
    ```
2.  **Start the development server:**
    ```sh
    npm run dev
    ```

This will open the application in your browser.
