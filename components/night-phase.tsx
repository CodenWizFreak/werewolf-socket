"use client";

import { useState, useEffect } from "react";
import type { Player, GameMessage } from "@/lib/game-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NightPhaseProps {
  player: Player;
  players: Player[];
  werewolfMessages?: GameMessage[];
  phase?: string;

  killLocked: { id: string; name: string } | null;
  werewolfTarget: { id: string; name: string } | null;
  healerPhaseActive: boolean;
  healerUsesLeft: number;
  onKill: (targetId: string) => void;
  onHeal: (targetId: string | null) => void;
  onWerewolfChat: (message: string) => void;
}

export default function NightPhase({
  player,
  players,
  werewolfMessages = [],
  phase = "night",
  killLocked,
  werewolfTarget,
  healerPhaseActive,
  healerUsesLeft,
  onKill,
  onHeal,
  onWerewolfChat,
}: NightPhaseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [werewolfChatMessage, setWerewolfChatMessage] = useState("");
  const [killSubmitted, setKillSubmitted] = useState(false);

  useEffect(() => {
    if (killLocked) {
      setKillSubmitted(false);
    }
  }, [killLocked]);

  useEffect(() => {
    if (phase === "night" || phase === "discussion") {
      setKillSubmitted(false);
      setSelected(null);
    }
  }, [phase]);

  const handleSendWerewolfMessage = () => {
    if (
      !werewolfChatMessage.trim() ||
      player.role !== "werewolf" ||
      !player.alive
    )
      return;
    onWerewolfChat(werewolfChatMessage);
    setWerewolfChatMessage("");
  };

  const showWerewolfChat = player.role === "werewolf" && player.alive;
  const isHealer = player.role === "healer" && player.alive;
  const isNightPhase = phase === "night";
  const isHealerPhase = phase === "healer";

  // If it's night phase and player is not werewolf, or healer phase and player is not healer
  if ((isNightPhase && !showWerewolfChat) || (isHealerPhase && !isHealer)) {
    return (
      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
        <p className="text-gray-400">
          {isNightPhase ? "Waiting for night phase to complete..." : "Waiting for healer to make their decision..."}
        </p>
        <p className="text-gray-500 text-sm mt-2">
          {isNightPhase ? "The werewolves are making their choice..." : "The healer is deciding whether to save someone..."}
        </p>
      </div>
    );
  }

  const handleAction = () => {
    if (player.role === "werewolf" && isNightPhase) {
      if (!selected || killLocked || killSubmitted) return;
      setKillSubmitted(true);
      onKill(selected);
      setSelected(null);
    } else if (player.role === "healer" && isHealerPhase) {
      onHeal(selected);
      setSelected(null);
    }
  };

  const alivePlayers = players.filter((p) => p.alive);

  // Check if the werewolf target is the healer themselves
  const isSavingSelf = werewolfTarget?.id === player.id;

  return (
    <div className="space-y-4">
      {showWerewolfChat && isNightPhase && (
        <div className="bg-red-900/20 rounded-lg border border-red-700/50 flex flex-col h-64 flex-shrink-0">
          <div className="p-3 border-b border-red-700/50 flex-shrink-0">
            <h3 className="font-bold text-red-400 flex items-center gap-2">
              🐺 Werewolf Chat (Private)
            </h3>
            <p className="text-xs text-red-300/70 mt-1">
              Coordinate with your pack - only alive werewolves can see this
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {werewolfMessages.length === 0 && (
              <p className="text-gray-400 text-sm text-center italic">
                No messages yet. Start planning your attack...
              </p>
            )}
            {werewolfMessages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-red-400">
                  {msg.playerName}:
                </span>
                <span className="text-gray-300 ml-2">{msg.message}</span>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-red-700/50 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={werewolfChatMessage}
                onChange={(e) => setWerewolfChatMessage(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleSendWerewolfMessage()
                }
                placeholder="Message your pack..."
                className="bg-slate-700 border-red-600/50 text-white placeholder:text-gray-500"
              />
              <Button
                onClick={handleSendWerewolfMessage}
                disabled={!werewolfChatMessage.trim() || !player.alive}
                className="bg-red-600 hover:bg-red-700"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {isNightPhase && showWerewolfChat && (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <h3 className="font-bold text-red-500 mb-4">
            🐺 Choose someone to kill
          </h3>

          {killLocked ? (
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-3">
              <p className="text-green-400 font-bold">
                ✅ Kill confirmed: {killLocked.name}
              </p>
              <p className="text-gray-300 text-sm mt-1">
                A werewolf has already chosen the target for tonight.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-3">
                Discuss with your pack above, then select your target
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {alivePlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={`p-2 rounded border transition ${
                      selected === p.id
                        ? "bg-red-600/50 border-red-500"
                        : "bg-slate-700 border-slate-600 hover:border-slate-500"
                    } ${p.id === player.id ? "ring-2 ring-yellow-500" : ""}`}
                  >
                    {p.name} {p.id === player.id && "(You)"}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleAction}
                disabled={!selected || killSubmitted}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {killSubmitted ? "Submitting..." : "Confirm Kill"}
              </Button>
            </>
          )}
        </div>
      )}

      {isHealerPhase && isHealer && (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <h3 className="font-bold text-green-500 mb-4">
            💚 Healer Phase - Save Someone
          </h3>
          
          {/* Only show heals remaining if healer is saving themselves */}
          {isSavingSelf && (
            <p className="text-sm text-yellow-400 mb-2">
              Self-heals remaining: {healerUsesLeft}/1
            </p>
          )}

          {werewolfTarget ? (
            <>
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-4">
                <p className="text-red-400 font-bold text-lg mb-2">
                  ⚠️ {werewolfTarget.name} was attacked by werewolves!
                </p>
                <p className="text-gray-300 text-sm">
                  Do you want to save them?
                  {isSavingSelf && " (This is YOU!)"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    setSelected(werewolfTarget.id);
                    onHeal(werewolfTarget.id);
                  }}
                  className="bg-green-600 hover:bg-green-700 h-12 text-lg font-bold"
                >
                  ✅ Save {werewolfTarget.name}
                </Button>
                <Button
                  onClick={() => {
                    setSelected(null);
                    onHeal(null);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 h-12 text-lg font-bold"
                >
                  ❌ Let them die
                </Button>
              </div>
              {isSavingSelf ? (
                <p className="text-yellow-400 text-xs text-center mt-2">
                  ⚠️ Self-heals remaining: {healerUsesLeft}/1 - After this, you cannot save yourself again.
                </p>
              ) : (
                <p className="text-gray-400 text-xs text-center mt-2">
                  You have unlimited heals for other players
                </p>
              )}
            </>
          ) : (
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-gray-400">
                Waiting for information about the werewolf attack...
              </p>
              <div className="mt-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}