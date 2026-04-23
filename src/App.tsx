/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { io, Socket } from "socket.io-client";
import { Users, User, ArrowRight, RefreshCw, Palette, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { PERSONALITY_CATEGORIES, CHARACTERS } from "./constants";

type Screen = "SELECT_GROUP" | "SELECT_CHARACTER" | "ACTIVITY";

interface CardData {
  id: string;
  trait: string;
  reason: string;
  timestamp: number;
}

interface RoomState {
  boxes: {
    [key: number]: CardData[];
  };
}

const CharImage = ({ src, name, size = "large" }: { src: string; name: string; size?: "small" | "large" }) => {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-full text-slate-400 ${size === "small" ? "w-10 h-10 text-xl" : "w-44 h-44 text-6xl"}`}>
        👤
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={name} 
      className={size === "small" ? "w-10 h-10 object-contain" : "w-44 h-44 object-contain group-hover:scale-110 transition-transform duration-500"} 
      onError={() => setError(true)}
    />
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("SELECT_GROUP");
  const [group, setGroup] = useState<number | null>(null);
  const [character, setCharacter] = useState<typeof CHARACTERS[0] | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState>({ boxes: { 1: [], 2: [], 3: [], 4: [] } });
  const [categoryIndex, setCategoryIndex] = useState(0);
  const activeCategory = PERSONALITY_CATEGORIES[categoryIndex];

  useEffect(() => {
    if (screen === "ACTIVITY" && group && character) {
      const newSocket = io();
      setSocket(newSocket);

      const roomId = `group-${group}-char-${character.id}`;
      newSocket.emit("join-room", roomId);

      newSocket.on("init-state", (state: RoomState) => {
        setRoomState(state);
      });

      newSocket.on("state-updated", (state: RoomState) => {
        setRoomState(state);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [screen, group, character]);

  const handleJoinGroup = (num: number) => {
    setGroup(num);
    setScreen("SELECT_CHARACTER");
  };

  const handleSelectCharacter = (char: typeof CHARACTERS[0]) => {
    setCharacter(char);
    setScreen("ACTIVITY");
  };

  const nextCategory = () => {
    setCategoryIndex((prev) => (prev + 1) % PERSONALITY_CATEGORIES.length);
  };
  
  const prevCategory = () => {
    setCategoryIndex((prev) => (prev - 1 + PERSONALITY_CATEGORIES.length) % PERSONALITY_CATEGORIES.length);
  };

  const addCardDirectly = (trait: string, boxId: number) => {
    if (!socket || !group || !character) return;
    const roomId = `group-${group}-char-${character.id}`;
    const newCard: CardData = {
      id: Math.random().toString(36).substr(2, 9),
      trait: trait,
      reason: "", // No reason needed anymore
      timestamp: Date.now(),
    };

    socket.emit("add-card", { roomId, boxId, card: newCard });
  };

  const removeCard = (boxId: number, cardId: string) => {
    if (!socket || !group || !character) return;
    const roomId = `group-${group}-char-${character.id}`;
    socket.emit("remove-card", { roomId, boxId, cardId });
  };

  if (screen === "SELECT_GROUP") {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full text-center border border-slate-200"
        >
          <h1 className="text-4xl font-black text-indigo-600 mb-2 tracking-tight">
            난 너의 성격을 알고 있지! 😎
          </h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-10">Real-time Character Analysis</p>
          
          <p className="text-xl font-bold text-slate-700 mb-8 border-b-2 border-indigo-50 pb-4">우리 모둠은 몇 모둠인가요?</p>
          
          <div className="flex justify-center gap-4 flex-wrap">
            {[1, 2, 3, 4, 5].map((num) => (
              <motion.button
                key={num}
                whileHover={{ scale: 1.05, backgroundColor: "#4f46e5", color: "#ffffff" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleJoinGroup(num)}
                className="w-20 h-20 bg-slate-50 border-2 border-slate-100 text-slate-800 font-black text-2xl rounded-2xl flex items-center justify-center transition-all shadow-sm hover:shadow-indigo-200 hover:shadow-lg"
              >
                {num}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (screen === "SELECT_CHARACTER") {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-12 max-w-4xl w-full text-center border border-slate-200"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="px-4 py-1 bg-indigo-600 text-white rounded-full text-sm font-black shadow-lg">제 {group}모둠</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-10 tracking-tight">탐구할 인물을 선택하세요</h2>
          
          <div className="flex justify-center gap-16">
            {CHARACTERS.map((char) => (
              <motion.div
                key={char.id}
                whileHover={{ y: -10 }}
                className="cursor-pointer group relative"
                onClick={() => handleSelectCharacter(char)}
              >
                <div className="w-56 h-56 bg-slate-50 rounded-[40px] mb-6 overflow-hidden border-4 border-slate-100 group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-all flex items-center justify-center shadow-xl group-hover:shadow-indigo-100 relative">
                  <CharImage src={char.image} name={char.name} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{char.name}</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Target Profile</p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-2 whitespace-nowrap"
                >
                  분석 시작 <ArrowRight size={14} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-800 p-4">
      {/* Header Section */}
      <header className="flex justify-between items-end mb-4 border-b-2 border-indigo-100 pb-2 z-10 bg-slate-50/80 backdrop-blur-md sticky top-0">
        <div>
          <h1 className="text-3xl font-black text-indigo-600 tracking-tight mb-1">
            난 너의 성격을 알고 있지! 😎
          </h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-sm">
              제 {group}모둠
            </span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              실시간 협동 학습 중
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">분석 대상 인물</p>
            <p className="text-xl font-black text-indigo-900 leading-none">{character?.name}</p>
          </div>
          <div className="w-12 h-12 bg-white border-2 border-indigo-200 rounded-xl flex items-center justify-center shadow-sm hover:rotate-3 transition-transform cursor-pointer overflow-hidden" onClick={() => setScreen("SELECT_GROUP")}>
             <CharImage src={character?.image || ""} name={character?.name || ""} size="small" />
          </div>
        </div>
      </header>

      {/* Categorized Card Pool */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4 mx-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest">
            <span className="w-2 h-4 bg-indigo-500 rounded-full"></span>
            성격 카드 저장소
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">화살표를 눌러 더 많은 카드를 보세요</span>
            <div className="flex gap-2">
              <button 
                  onClick={prevCategory}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-all active:scale-90"
                  title="이전 카드 그룹"
              >
                  <ChevronLeft size={16} />
              </button>
              <button 
                  onClick={nextCategory}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-all active:scale-90"
                  title="다음 카드 그룹"
              >
                  <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center">
          {activeCategory.traits.map((trait, idx) => (
            <motion.div
              key={`${trait}-${idx}-${categoryIndex}`}
              drag
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                 // Check drop targets
                 const dropZones = document.querySelectorAll('[data-box-id]');
                 let boxId: string | null = null;

                 // Using point coordinates to detect collision
                 for (const zone of Array.from(dropZones)) {
                   const rect = zone.getBoundingClientRect();
                   if (
                     info.point.x >= rect.left &&
                     info.point.x <= rect.right &&
                     info.point.y >= rect.top &&
                     info.point.y <= rect.bottom
                   ) {
                     boxId = zone.getAttribute('data-box-id');
                     break;
                   }
                 }

                 if (boxId) {
                   const idNum = parseInt(boxId);
                   if (idNum > 0) addCardDirectly(trait, idNum);
                 }
              }}
              whileHover={{ scale: 1.05, backgroundColor: "#f8fafc" }}
              whileDrag={{ scale: 1.15, zIndex: 100, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              className={`px-3 py-1.5 border rounded-lg text-center text-[11px] font-black cursor-grab active:scale-95 transition-colors shadow-sm ${
                categoryIndex === 0 ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400" :
                categoryIndex === 1 ? "bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400" :
                categoryIndex === 2 ? "bg-rose-50 border-rose-200 text-rose-700 hover:border-rose-400" :
                "bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400"
              }`}
            >
              {trait}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom Area: Collaborative Workspace */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 relative">
        {/* Center Character Focus */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-44 h-44 bg-indigo-50 rounded-full border-8 border-white shadow-xl flex flex-col items-center justify-center p-4 text-center ring-4 ring-indigo-100 relative group overflow-hidden pointer-events-auto"
          >
            <CharImage src={character?.image || ""} name={character?.name || ""} />
            <p className="font-black text-indigo-900 text-base leading-none mb-1">{character?.name}</p>
            <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-black">Character</p>
          </motion.div>
        </div>

        {/* 4 Player Boxes */}
        {[1, 2, 3, 4].map((id) => (
          <div 
            key={id}
            data-box-id={id}
            className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-4 flex flex-col relative transition-all hover:border-indigo-200 hover:bg-slate-50/50"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm ${
                id === 1 ? "bg-rose-400" : id === 2 ? "bg-blue-400" : id === 3 ? "bg-amber-400" : "bg-emerald-400"
              }`}>
                {id}
              </div>
              <span className="font-black text-slate-700 text-sm">학생 {id}의 성격 박스</span>
              {roomState.boxes[id]?.length > 0 && (
                <span className={`ml-auto text-[10px] ${
                  id === 1 ? "bg-rose-100 text-rose-600" : id === 2 ? "bg-blue-100 text-blue-600" : id === 3 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                } px-2 py-0.5 rounded-md font-black animate-pulse`}>활동 중</span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-none">
              {roomState.boxes[id]?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-slate-50 bg-slate-50/30 rounded-2xl opacity-40">
                   <p className="text-xl mb-1">📥</p>
                   <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">성격 박스 비어있음</p>
                </div>
              ) : (
                roomState.boxes[id]?.map((card) => (
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    key={card.id}
                    className="bg-slate-50 border border-slate-200 p-2 rounded-xl relative group shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center min-h-[40px]"
                  >
                    <button 
                      onClick={() => removeCard(id, card.id)}
                      className="absolute -top-1.5 -right-1.5 bg-white text-slate-400 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-slate-100 hover:text-rose-500 hover:border-rose-100 z-10"
                    >
                      <X size={10} />
                    </button>
                    <p className="text-xs font-black text-indigo-600 truncate px-2">
                      {card.trait}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Instruction */}
      <footer className="mt-4 text-center shrink-0">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
          다른 모둠원들이 카드를 넣으면 실시간으로 화면에 나타납니다
        </p>
      </footer>
    </div>
  );
}
