"use client";

import { useState, useRef, useEffect } from "react";
import type { Player, GameMessage } from "@/lib/game-types";
import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatPanelProps {
  messages: GameMessage[];
  player: Player | null;
  players?: Player[];
}

export default function ChatPanel({
  messages,
  player,
  players = [],
}: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socket = getSocket();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !player) return;

    socket.emit("chat-message", {
      message: newMessage,
      playerName: player.name,
    });

    setNewMessage("");
    setShowMentions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    setNewMessage(value);
    setCursorPosition(cursorPos);

    // Check if user is typing @ mention
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1 && lastAtIndex === cursorPos - 1) {
      // Just typed @
      setShowMentions(true);
      setMentionSearch("");
    } else if (lastAtIndex !== -1 && cursorPos > lastAtIndex) {
      // Typing after @
      const searchText = textBeforeCursor.slice(lastAtIndex + 1);
      if (!searchText.includes(" ")) {
        setShowMentions(true);
        setMentionSearch(searchText);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (mentionedPlayer: Player) => {
    const textBeforeCursor = newMessage.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      // Keep everything before the @ symbol
      const beforeAt = newMessage.slice(0, lastAtIndex);
      // Get everything after the current cursor position
      const afterCursor = newMessage.slice(cursorPosition);
      // Construct the new message with mention in the correct position
      const newText = `${beforeAt}@${mentionedPlayer.name} ${afterCursor}`;
      const newCursorPos = beforeAt.length + mentionedPlayer.name.length + 2; // +2 for @ and space

      setNewMessage(newText);
      setShowMentions(false);
      setMentionSearch("");

      // Refocus input and set cursor position
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  // Filter players for mention dropdown
  const mentionablePlayers = players.filter(
    (p) =>
      p.id !== player?.id &&
      p.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // All alive players can chat normally during discussion
  const canChat = player?.alive;
  const isDead = player && !player.alive;
  const isDeadSnitch = player?.role === "snitch" && !player?.alive;

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 flex flex-col h-96">
      <div className="p-4 border-b border-slate-700 shrink-0">
        <h3 className="font-bold text-red-500">Chat</h3>
        {isDead && !isDeadSnitch && (
          <p className="text-xs text-red-400 mt-1">
            👻 Spectating - You cannot chat
          </p>
        )}
        {isDeadSnitch && (
          <p className="text-xs text-yellow-400 mt-1">
            🕵️ You're dead but can send one private message using the panel
            above
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center italic">
            No messages yet. Start the discussion!
          </p>
        )}
        {messages.map((msg, i) => {
          // Parse message for mentions
          const messageParts = msg.message.split(/(@\w+)/g);

          return (
            <div key={i} className="text-sm">
              <span className="font-medium text-cyan-400">
                {msg.playerName}:
              </span>
              <span className="text-gray-300 ml-2">
                {messageParts.map((part, idx) => {
                  if (part.startsWith("@")) {
                    return (
                      <span key={idx} className="text-yellow-400 font-semibold">
                        {part}
                      </span>
                    );
                  }
                  return <span key={idx}>{part}</span>;
                })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {canChat && (
        <div className="p-4 border-t border-slate-700 shrink-0 space-y-2 relative">
          {showMentions && mentionablePlayers.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto z-10">
              {mentionablePlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleMentionSelect(p)}
                  className="w-full px-4 py-2 text-left hover:bg-slate-600 text-white text-sm flex items-center gap-2 transition-colors"
                >
                  <span className="text-cyan-400">@</span>
                  <span>{p.name}</span>
                  {!p.alive && (
                    <span className="text-xs text-gray-400">👻</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message... Use @ to mention"
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Send
            </Button>
          </div>
        </div>
      )}

      {isDead && !isDeadSnitch && (
        <div className="p-4 border-t border-slate-700 text-center text-gray-400 text-sm">
          👻 You are dead. You can view chat but cannot send messages.
        </div>
      )}

      {isDeadSnitch && (
        <div className="p-4 border-t border-slate-700 text-center text-yellow-400 text-sm">
          🕵️ Use the Snitch Message panel above to send your one-time private
          clue.
        </div>
      )}
    </div>
  );
}
