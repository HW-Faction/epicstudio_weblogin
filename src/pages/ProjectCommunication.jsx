import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function ProjectCommunication() {
  const { id } = useParams();
  const { user, dbUser } = useAuth();

  const [messages, setMessages] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [tab, setTab] = useState("CLIENT_VISIBLE");

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const role = dbUser?.role || "EMPLOYEE";
  const isClient = role === "CLIENT";

  // 🔥 FETCH
  const fetchMessages = async () => {
    const snap = await getDocs(
      collection(db, `projects/${id}/messages`)
    );

    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // sort by time
    list.sort((a, b) => a.createdAt - b.createdAt);

    setMessages(list);
  };

  useEffect(() => {
    fetchMessages();

    const interval = setInterval(fetchMessages, 3000); // pseudo realtime
    return () => clearInterval(interval);
  }, []);

  // 🔥 FILTER
  useEffect(() => {
    let data = [...messages];

    if (isClient) {
      data = data.filter((m) => m.visibility === "CLIENT_VISIBLE");
    } else {
      data = data.filter((m) => m.visibility === tab);
    }

    setFiltered(data);
  }, [messages, tab, isClient]);

  // 🔥 SEND MESSAGE
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

    fetchMessages();
  };

  return (
    <div className="p-6 flex flex-col h-[90vh]">

      {/* HEADER */}
      <div className="flex gap-6 border-b mb-4">
        {["CLIENT_VISIBLE", "INTERNAL"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 ${
              tab === t
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500"
            }`}
          >
            {t === "CLIENT_VISIBLE" ? "Client Visible" : "Internal"}
          </button>
        ))}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">

        {filtered.map((msg) => {
          const isMe = msg.senderId === user.uid;

          return (
            <div
              key={msg.id}
              className={`flex ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >

              <div
                className={`max-w-[60%] p-3 rounded-xl text-sm shadow ${
                  isMe
                    ? "bg-blue-500 text-white"
                    : "bg-white border"
                }`}
              >

                {/* NAME */}
                <p className="text-xs opacity-70 mb-1">
                  {msg.senderName}
                </p>

                {/* TEXT */}
                {msg.message && <p>{msg.message}</p>}

                {/* FILE */}
                {msg.fileUrl && (
                  <div className="mt-2">

                    {msg.type === "IMAGE" && (
                      <img
                        src={msg.fileUrl}
                        className="rounded max-h-40"
                      />
                    )}

                    {msg.type === "VIDEO" && (
                      <video
                        src={msg.fileUrl}
                        controls
                        className="max-h-40"
                      />
                    )}

                    {msg.type === "PDF" && (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        className="underline text-sm"
                      >
                        📄 {msg.fileName}
                      </a>
                    )}

                  </div>
                )}

                {/* TIME */}
                <p className="text-[10px] opacity-60 mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>

              </div>
            </div>
          );
        })}

      </div>

      {/* INPUT */}
      <div className="mt-4 flex gap-2">

        <input
          className="border p-2 flex-1 rounded"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={handleSend}
          className="bg-primary text-white px-4 rounded"
        >
          Send
        </button>

      </div>

    </div>
  );
}