"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import axios from "axios";
//@ts-ignore
import { getSubtitles } from "youtube-captions-scraper";

const PALM_API_KEY = process.env.PALM_API_KEY;

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: number;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ytUrl, setYtUrl] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const isValidInputText = (inputText: string) => {
    return inputText.trim() !== ""; // Simple validation logic
  };

  const extractYouTubeVideoId = () => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = ytUrl.match(regex);
    return match ? match[1] : null;
  };

  const fetchSubtitles = async (videoId: string) => {
    try {
      const captions = await getSubtitles({
        videoID: videoId,
        lang: "en", // Change to desired language
      });
      setInputText(captions);
    } catch (error) {
      console.error("Error fetching subtitles:", error);
    }
  };

  useEffect(() => {
    const videoId = extractYouTubeVideoId();
    if (videoId) {
      fetchSubtitles(videoId);
    }
  }, [ytUrl]);

  const generateText = async () => {
    if (!isValidInputText(inputText)) {
      // Handle invalid input
      return;
    }

    setLoading(true);
    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta3/models/text-bison-001:generateText";

    const requestData = {
      prompt: {
        text: `Act as the best teacher in the world. I'm giving you the subtitle of a YouTube video, understand it, and I'll ask some questions about it: ${inputText}`,
      },
      temperature: 0.25,
      top_k: 40,
      top_p: 0.95,
      candidate_count: 1,
    };

    const headers = {
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(
        `${apiUrl}?key=${PALM_API_KEY}`,
        requestData,
        {
          headers,
        }
      );

      if (response.status === 200) {
        const botResponse = response.data.candidates[0]?.output;
        if (botResponse) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: inputText,
              sender: "user",
              timestamp: Date.now(),
            },
            {
              id: prevMessages.length + 2,
              text: botResponse,
              sender: "bot",
              timestamp: Date.now(),
            },
          ]);
          setInputText("");
        } else {
          console.error("Response structure error");
        }
      } else {
        console.error("Google Cloud API Error");
      }
    } catch (error) {
      console.error("Error generating text:", error);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Scrape Talk</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Paste the YouTube URL"
          value={ytUrl}
          onChange={(e) => setYtUrl(e.target.value)}
          className="w-full p-3 border rounded-lg text-black mb-2"
        />
        <button
          //@ts-ignore
          onClick={() => fetchSubtitles(extractYouTubeVideoId())}
          className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Learn
        </button>
      </div>

      <div className="space-y-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-4 rounded-lg max-w-xl ${
                message.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              <p>{message.text}</p>
              <p className="text-xs mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex">
        <input
          type="text"
          placeholder="Let's chat"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 p-3 border rounded-lg text-black text-lg"
        />
        <button
          onClick={generateText}
          className="ml-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition duration-300"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
