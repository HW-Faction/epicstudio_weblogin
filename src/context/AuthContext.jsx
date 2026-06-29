import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
  doc,
  getDoc,
  collectionGroup,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toastTimeout = useRef(null);
  const [toast, setToast] = useState(null);
  const audioReadyRef = useRef(false);

  const audioRef = useRef(null);
  const initialLoad = useRef(true);
  const seenMessages = useRef(new Set());

  useEffect(() => {
  const unlockAudio = async () => {
    if (!audioRef.current) return;

    try {
      const audio = audioRef.current;

      // force load
      audio.load();

      // wait until browser actually loads enough
      await new Promise((resolve) => {
        if (audio.readyState >= 2) {
          resolve();
        } else {
          audio.oncanplaythrough = resolve;
        }
      });

      console.log("Audio ready:", audio.readyState);

      audio.volume = 0;

      await audio.play();

      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;

      audioReadyRef.current = true;

      console.log("Audio unlocked");
    } catch (err) {
      console.log("Unlock failed:", err);
    }
  };

  window.addEventListener("click", unlockAudio, {
    once: true,
  });

  return () =>
    window.removeEventListener("click", unlockAudio);
}, []);

  useEffect(() => {
    let unsubscribeMessages = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          try {
            const docRef = doc(db, "users", currentUser.uid);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
              setDbUser(snap.data());
            } else {
              setDbUser(null);
            }

            // GLOBAL MESSAGE LISTENER
            const q = query(
              collectionGroup(db, "messages"),
             //orderBy("createdAt")
            );

            unsubscribeMessages = onSnapshot(q, async (snap) => {
              console.log("Snapshot fired");

              // Skip initial load
              if (initialLoad.current) {
                initialLoad.current = false;
                return;
              }

              for (const change of snap.docChanges()) {
                if (change.type !== "added") continue;

                const msg = {
                  id: change.doc.id,
                  ...change.doc.data(),
                };

                console.log("NEW MESSAGE:", msg);

                // Ignore own message in current active tab
                if (
                  msg.senderId === currentUser.uid &&
                  document.hasFocus()
                ) {
                  continue;
                }

                let projectName = "Project";

                if (msg.projectId) {
                  try {
                    const projectSnap = await getDoc(
                      doc(db, "projects", msg.projectId)
                    );

                    if (projectSnap.exists()) {
                      projectName =
                        projectSnap.data().projectName || "Project";
                    }
                  } catch {}
                }

                // Sound
                const audio = audioRef.current;

                console.log("Trying sound...", audio);

                if (!audio) {
                  console.log("No audio ref");
                  return;
                }

                console.log("Audio unlocked?", audioReadyRef.current);

                try {
                  audio.pause();
                  audio.currentTime = 0;
                  audio.volume = 1;
                  audio.muted = false;

                  await audio.play();

                  console.log("PLAY SUCCESS");
                } catch (err) {
                  console.log("PLAY FAILED", err);
                }


                // Toast
                setToast({
                  sender: msg.senderName,
                  project: projectName,
                  message:
                    msg.type === "TEXT"
                      ? msg.message
                      : `Sent a ${msg.type.toLowerCase()}`,
                });

                clearTimeout(toastTimeout.current);

                toastTimeout.current = setTimeout(() => {
                  setToast(null);
                }, 5000);
              }
            });
          } catch (err) {
            console.error("Error fetching user:", err);
          }
        } else {
          setDbUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, dbUser }}>
      {!loading && (
        <>
          {/* GLOBAL AUDIO */}
          <audio
            ref={audioRef}
            src="/sounds/message.mp3"
            preload="auto"
          />

          {children}

          {/* GLOBAL TOAST */}
          {toast && (
            <div className="fixed top-5 right-5 z-50 animate-slideDown">
              <div className="relative overflow-hidden backdrop-blur-xl bg-white/90 border border-white/30 shadow-2xl rounded-2xl min-w-[360px] max-w-[420px] p-4">

                {/* accent bar */}
                <div className="absolute left-0 top-0 h-full w-1.5 bg-primary rounded-l-2xl" />

                <div className="pl-3 flex gap-3 items-start">

                  {/* avatar */}
                  <div className="w-11 h-11 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <span className="text-sm font-bold text-primary">
                      {toast.sender?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>

                  {/* content */}
                  <div className="flex-1 min-w-0">

                    {/* top row */}
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-zinc-900 truncate">
                        {toast.sender}
                      </h4>

                      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                        New Message
                      </span>
                    </div>

                    {/* project badge */}
                    <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full bg-zinc-100 text-[11px] font-medium text-zinc-600">
                      {toast.project}
                    </div>

                    {/* message preview */}
                    <p className="mt-2 text-sm text-zinc-700 leading-relaxed line-clamp-2">
                      {toast.message}
                    </p>
                  </div>
                </div>

                {/* subtle glow */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-r from-white/10 to-transparent" />
              </div>
            </div>
          )}
        </>
      )}
    </AuthContext.Provider>
  );
}