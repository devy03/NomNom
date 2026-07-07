import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Plus, LogIn, History } from "lucide-react";
import { AIOrb } from "@/components/shared/AIOrb";
import { GroupHistory } from "@/components/GroupHistory";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { createRoom, findRoomByCode, updateRoomName } from "@/services/groupService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export function GroupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const room = await createRoom(user?.id);

      // Set room name if provided
      if (roomName.trim()) {
        await updateRoomName(room.id, roomName.trim());
      }

      toast("Room created! Share the invite link with your group.", "success");
      setRoomName("");
      navigate(`/group/${room.roomCode}`);
    } catch {
      toast("Couldn't create a room right now.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!code) return;
    setJoining(true);
    try {
      const room = await findRoomByCode(code);
      if (!room) {
        toast("Room not found. Double-check the code.", "error");
        return;
      }
      navigate(`/group/${room.roomCode}`);
    } catch {
      toast("Couldn't find that room.", "error");
    } finally {
      setJoining(false);
    }
  };

  const handleRejoin = (code: string) => {
    navigate(`/group/${code}`);
    setShowHistory(false);
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-10 text-center">
      <AIOrb size={140} className="mb-4" />
      <div className="mb-2 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-zinc-300">
        <Users size={13} className="text-violet-400" /> Group Decision Room
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-white">Let everyone get what they want</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Create a room, share the link, and everyone sets their own preferences. We'll find the perfect match.
      </p>

      {user && (
        <Button
          size="sm"
          variant="glass"
          onClick={() => setShowHistory(!showHistory)}
          className="mt-4"
        >
          <History size={14} /> {showHistory ? "Hide History" : "View History"}
        </Button>
      )}

      {showHistory && user && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong w-full rounded-3xl p-6 mt-6 max-h-96 overflow-y-auto"
        >
          <GroupHistory onRejoin={handleRejoin} />
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-strong mt-8 w-full rounded-3xl p-6">
        <div className="space-y-3 text-left mb-6">
          <Label>Room Name (Optional)</Label>
          <Input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. Pizza Night, Team Lunch"
            maxLength={50}
          />
        </div>

        <Button size="lg" className="w-full" onClick={handleCreate} disabled={creating}>
          <Plus size={16} /> {creating ? "Creating room..." : "Create a Room"}
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-zinc-600">
          <div className="h-px flex-1 bg-white/10" /> or join with a code <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleJoin} className="space-y-3 text-left">
          <Label>Room Code</Label>
          <div className="flex gap-2">
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. 8F2A1C"
              className="text-center tracking-widest"
              maxLength={6}
            />
            <Button type="submit" variant="glass" disabled={joining}>
              <LogIn size={15} />
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
