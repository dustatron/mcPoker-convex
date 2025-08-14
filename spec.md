
## **Agile Poker Voting Tool – Feature Specification**

### **1. Core Functionality**

* Real-time agile poker voting for teams.
* Standard numeric Agile Poker scale (e.g., `1, 2, 3, 5, 8, 13` — fixed, no custom labels or values).
* Votes remain hidden until someone clicks **Show Votes**.
* Any participant can:

  * Vote/change vote at any time (before or after reveal).
  * Show/hide votes.
  * Reset the round.
* Resetting:

  * Clears current votes and starts a new round.
  * Saves the final revealed votes into **room history**.

---

### **2. Rooms**

* Each team has its own **persistent room** (permanent link).
* Link alone is enough to join (no password or ticket tracking).
* Room persists indefinitely unless **all participants leave** for **24 hours**, then votes & history are cleared.
* No ticket or story tracking in-app (teams track outside).
* All participants have equal permissions (no “host” role).

---

### **3. Joining & Names**

* Joining requires entering a name before seeing the room.
* Name saved in **local storage** for rejoining later.
* Name can be **changed after joining**.
* Everyone in a room always has a vote (no observer role).

---

### **4. Real-Time Presence**

* Live list of **currently connected participants**.
* Shows **vote status** (“has voted” / “not voted yet”) before reveal.
* Shows real-time join/leave events.

---

### **5. History**

* Keeps history of up to **99 past rounds**.
* Each history entry stores:

  * **Final revealed votes** only (no pre-reveal changes).
  * **Who voted what**.
* History is **visible to everyone** in the room.

---

### **6. UI & Platform**

* Desktop-focused (no special mobile optimization required).
* No chat, comments, or timer features.
* Minimal interface for quick voting & reveal/reset actions.

---

If you’re happy with this, the next step is for me to draft:

1. **Data model & Convex schema**
2. **Next.js page & component structure**
3. **Real-time vote sync logic**

Do you want me to go ahead and start with the **Convex schema** first?
