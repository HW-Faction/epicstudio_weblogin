import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import NavigationHeader from "../components/NavigationHeader";
import ProjectNavigationChips from "../components/ProjectNavigationChips";

export default function ProjectCommunication() {
  const { id } = useParams();
  const { user, dbUser } = useAuth();
  const [project, setProject] = useState(null);

  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState("CLIENT_VISIBLE");

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const [typingUsers, setTypingUsers] = useState([]);

  const role = dbUser?.role || "EMPLOYEE";
  const isClient = role === "CLIENT";

  useEffect(() => {
      const fetchProject = async () => {     
        const snap = await getDoc(doc(db, "projects", id));
        if (snap.exists()) {     
          setProject({ id: snap.id, ...snap.data() });
        }
      };
      fetchProject();
    }, [id]);

  // ===== REALTIME MESSAGES =====
  useEffect(() => {
    const q = query(
      collection(db, `projects/${id}/messages`),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setMessages(list);
    });

    return () => unsub();
  }, [id]);

  // ===== TYPING INDICATOR =====
  useEffect(() => {
    const q = collection(db, `projects/${id}/typing`);

    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs.map((d) => d.data());
      setTypingUsers(users.filter((u) => u.uid !== user.uid));
    });

    return () => unsub();
  }, [id]);

  const updateTyping = async (isTyping) => {
    const refDoc = doc(db, `projects/${id}/typing/${user.uid}`);
    if (isTyping) {
      await setDoc(refDoc, {
        uid: user.uid,
        name: dbUser?.name,
      });
    } else {
      await setDoc(refDoc, {});
    }
  };

  // ===== FILTER =====
  const filtered = messages.filter((m) => {
    if (isClient) return m.visibility === "CLIENT_VISIBLE";
    return m.visibility === tab;
  });

  // ===== SEND =====
  const handleSend = async () => {
    if (!text && !file) return;

    let fileUrl = "";
    let fileName = "";
    let type = "TEXT";

    if (file) {
      const path = `projects/${id}/chat/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file);
      fileUrl = await getDownloadURL(storageRef);
      fileName = file.name;

      if (file.type.includes("image")) type = "IMAGE";
      else if (file.type.includes("pdf")) type = "PDF";
      else if (file.type.includes("video")) type = "VIDEO";
    }

    await addDoc(collection(db, `projects/${id}/messages`), {
      projectId: id,
      senderId: user.uid,
      senderName: dbUser?.name || "User",
      message: text,
      type,
      fileUrl,
      fileName,
      visibility: tab,
      createdAt: Date.now(),
    });

    setText("");
    setFile(null);
    updateTyping(false);
  };

  const getInitial = (name) =>
    name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="p-6 flex flex-col h-[90vh]">

      {/* NAV */}
      <NavigationHeader
        title="Communication"
        breadcrumbs={[
          { label: "Projects", path: "/projects" },
          { label: project?.projectName },
        ]}
        rightContent={<ProjectNavigationChips />}
      />

      {/* TABS */}
      <div className="flex gap-2 mt-4 mb-4">
        {["CLIENT_VISIBLE", "INTERNAL"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              tab === t
                ? "bg-primary text-white"
                : "bg-gray-100"
            }`}
          >
            {t === "CLIENT_VISIBLE" ? "Client Visible" : "Internal"}
          </button>
        ))}
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto space-y-4">

        {filtered.map((msg) => {
          const isMe = msg.senderId === user.uid;

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                  {getInitial(msg.senderName)}
                </div>
              )}

              <div
                className={`max-w-[65%] px-4 py-3 rounded-2xl ${
                  isMe
                    ? "bg-primary text-white"
                    : "bg-white border"
                }`}
              >
                <p className="text-xs opacity-60 mb-1">
                  {msg.senderName}
                </p>

                {msg.message && <p>{msg.message}</p>}

                {msg.fileUrl && (
                  <div className="mt-2">
                    {msg.type === "IMAGE" && (
                      <img src={msg.fileUrl} className="rounded-lg max-h-48" />
                    )}
                    {msg.type === "VIDEO" && (
                      <video src={msg.fileUrl} controls className="max-h-48" />
                    )}
                    {msg.type === "PDF" && (
                      <a href={msg.fileUrl} target="_blank">
                        📄 {msg.fileName}
                      </a>
                    )}
                  </div>
                )}

                <p className="text-[10px] mt-2 text-right opacity-60">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          );
        })}

        {/* TYPING */}
        {typingUsers.length > 0 && (
          <p className="text-xs text-gray-400">
            {typingUsers.map((u) => u.name).join(", ")} typing...
          </p>
        )}
      </div>

      {/* INPUT BAR */}
      <div className="mt-4 border rounded-xl p-3 flex items-center gap-3 bg-white">

        {/* ATTACH BUTTON */}
        <label className="cursor-pointer px-3 py-2 bg-gray-100 rounded-lg text-sm">
          📎
          <input
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        {/* TEXT */}
        <input
          className="flex-1 outline-none text-sm"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            updateTyping(true);
          }}
        />

        {/* FILE PREVIEW */}
        {file && (
          <span className="text-xs text-gray-500">
            {file.name}
          </span>
        )}

        {/* SEND */}
        <button
          onClick={handleSend}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm"
        >
          Send
        </button>

      </div>

    </div>
  );
}