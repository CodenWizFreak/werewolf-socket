# Werewolf: A Game of Deception

<img width="807" height="807" alt="logo" src="https://github.com/user-attachments/assets/7fafcc22-cc82-4f50-b036-38cb1edcd9e9" />


A real-time, online multiplayer game based on the classic party game "Werewolf". Villagers must work together to find and eliminate the werewolves, while the werewolves try to kill all the villagers. This version includes special roles like the Healer, Seer, and Snitch for added strategy and chaos!

---

## Features

* **Real-time Multiplayer:** Play with 4-8 players.
* **Lobby System:** Create a private room and share the Room ID to play with friends.
* **Unique Roles:** Play as a Werewolf, Healer, Seer, Snitch, or Villager.
* **In-Game Chat:** Discuss, debate, and deceive during the day phase.
* **Private Werewolf Chat:** Werewolves can secretly coordinate their attacks.
* **Special Abilities:** Use the unique powers of the Healer, Seer, and Snitch.
* **Timed Rounds:** Keep the game moving with timed phases for killing, healing, discussion, and voting.
* **Spectator Mode:** Dead players can watch the rest of the game unfold.

---

## Installation & Setup

To get the project running locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/CodenWizFreak/werewolf-socket.git](https://github.com/CodenWizFreak/werewolf-socket.git)
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd werewolf-socket
    ```

3.  **Install dependencies:**
    *(Note: Using `--legacy-peer-deps` as required for this project's dependencies)*
    ```bash
    npm install --legacy-peer-deps
    npm install --save-dev ts-node @types/node --legacy-peer-deps
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

---

## How to Play

### 1. Starting a Game
* **Host:** Enters their name and clicks "**Create Room**". They will receive a **Room ID**.
* **Other Players:** Enter their name, paste the **Room ID** provided by the host, and click "**Join Game**".
* **Host:** Once all players are in the lobby, the host can click "**Start Game**".

### 2. Joining
* **Late Joiners:** Cannot join a game that has already started.
* **Mid-Game Quitters:** If players quit mid-game, the game will check for win conditions.
    * If a Werewolf quits (and they are the last Werewolf), the Villagers win.
    * If Villagers quit until the Werewolves cannot lose (e.g., 2 Werewolves + 1 Villager remain), the Werewolves win.

---

## Rules of the Game

### Game Setup
The game requires 4 to 8 players. Roles are assigned automatically at the start based on the player count:

* **4 Players:** 1 Werewolf, 1 Healer, 2 Villagers
* **5 Players:** 1 Werewolf, 1 Seer, 1 Healer, 2 Villagers
* **6 Players:** 2 Werewolves, 1 Seer, 1 Healer, 2 Villagers
* **7 Players:** 2 Werewolves, 1 Snitch, 1 Seer, 1 Healer, 2 Villagers
* **8 Players:** 2 Werewolves, 1 Snitch, 1 Seer, 1 Healer, 3 Villagers

---

###  Role Descriptions

* **Werewolf**
    * **Goal:** Eliminate all players until the number of Werewolves is equal to or greater than the number of other players.
    * **Ability:** At night, you have **30 seconds** to choose a player to kill.
    * **Note:** If there are two Werewolves, you can chat privately with each other at any time (as long as both are alive) to coordinate your kill.

* **Healer**
    * **Goal:** Help the Villagers win by saving players from the Werewolves.
    * **Ability:** After the Werewolf chooses a victim, you have **30 seconds** to see who was targeted. You can then choose whether to save them.
    * **Special Ability (Self-Save):** The *first time* a Werewolf targets you, you can choose to save yourself. If you are targeted a *second time*, you cannot save yourself and will be killed.
    * **Note:** This ability does not protect you from being voted out during the day.

* **Seer**
    * **Goal:** Help the Villagers win by identifying the Werewolves.
    * **Ability:** You can see who the Werewolves are for the *entire game*. Use this information wisely to guide the discussion without getting killed.

* **Snitch**
    * **Goal:** Help the Villagers win, even from the grave.
    * **Ability:** This ability activates **after you die** (by kill or vote). You get to send **one private message** to any single *alive* player during the discussion phase. Use it to give a final, crucial clue.

* **Villager**
    * **Goal:** Find and vote out all the Werewolves.
    * **Ability:** None! Your power is in your observation, your voice, and your vote.

---

### Game Flow (Per Round)

Each round has a total duration of **4 minutes and 40 seconds**.

1.  **Night: Werewolf Phase (30 seconds)**
    * Werewolves choose a player to kill.
    * *(If no one is chosen, a random non-werewolf player is killed).*

2.  **Night: Healer Phase (30 seconds)**
    * The Healer sees the targeted player and decides whether to save them.
    * *(If no choice is made, "Don't Save" is selected by default, and the player dies).*

3.  **Day: Discussion Phase (180 seconds / 3 minutes)**
    * All *alive* players discuss who they think the Werewolf is.
    * Dead players can spectate but cannot chat (except for the Snitch's one-time ability).

4.  **Day: Voting Phase (30 seconds)**
    * All *alive* players cast their vote to eliminate one player.

5.  **Day: Vote Reveal (10 seconds)**
    * All votes are revealed. The player with the most votes is eliminated.
    * *(If there is a tie, no one is voted out, and the game proceeds).*

The game continues with the next round until a win condition is met.

---

### Win Conditions

* **Villagers Win:** All Werewolves are successfully voted out.
* **Werewolves Win:** The number of Werewolves is equal to or greater than the number of Villagers and other special roles.
    * *Example 1:* 1 Werewolf and 1 Villager remain. **Werewolf wins.**
    * *Example 2:* 2 Werewolves and 1 Villager remain. **Werewolves win.**

---

## Tech Stack

This project is built with a modern, real-time tech stack:

### Core
* **Framework:** [Next.js](https://nextjs.org/) (v16)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **UI Library:** [React](https://react.dev/) (v19)

### Backend & Real-time
* **Server:** Custom Node.js server (using `ts-node`)
* **WebSockets:** [Socket.IO](https://socket.io/) (for real-time chat, game state, and events)

### Frontend & UI
* **Component Library:** [shadcn/ui](https://ui.shadcn.com/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
* **UI Primitives:** [Radix UI](https://www.radix-ui.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Charts:** [Recharts](https://recharts.org/)
* **Notifications:** [Sonner](https://sonner.emilflorez.com/)
* **Themes:** [next-themes](https://github.com/pacocoursey/next-themes) (for light/dark mode)

### Forms & Validation
* **Form Management:** [React Hook Form](https://react-hook-form.com/)
* **Schema Validation:** [Zod](https://zod.dev/)

### Deployment & Tooling
* **Analytics:** [Vercel Analytics](https://vercel.com/analytics)
* **Package Manager:** [npm](https://www.npmjs.com/)

---

## Contributing

Contributions are welcome! Please feel free to open a pull request or submit an issue.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE.md` for more information.
