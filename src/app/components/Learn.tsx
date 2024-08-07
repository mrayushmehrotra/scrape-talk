"use client";
import React, { useState, ChangeEvent } from "react";
import axios from "axios";
import { getSubtitles } from "youtube-captions-scraper";

const PALM_API_KEY = "AIzaSyCRtedjMow7pZPenWrn5Qg3XQiZrmeHPdI";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: number;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ytUrl, setYtUrl] = useState<String>("");
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<Boolean>(false);

  function extractYouTubeVideoId(inputText: any) {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = inputText.match(regex);
    return match ? match[1] : null;
  }
  getSubtitles({
    videoID: extractYouTubeVideoId, // youtube video id
    lang: "fr", // default: `en`
  }).then((captions: string | any) => {
    setInputText(captions);
  });

  const generateText = async () => {
    if (!isValidInputText(inputText)) {
      // Handle invalid input
      return;
    }
    function isValidInputText(inputText: string) {
      // Implement your validation logic here
      // For example, check for empty strings, invalid characters, etc.
      return true; // Replace with actual validation logic
    }
    setLoading(true);
    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta3/models/text-bison-001:generateText";

    const requestData = {
      prompt: {
        text: inputText,
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
      if (inputText.trim() === "") {
        return;
      }
      const response = await axios.post(
        `${apiUrl}?key=${PALM_API_KEY}`,
        requestData,
        {
          headers,
        }
      );
      if (response.status === 200) {
        if (
          response.data &&
          response.data.candidates &&
          response.data.candidates.length > 0
        ) {
          const botResponse = response.data.candidates[0].output;
          // add the user's input to the message array
          const newUserMessage: Message = {
            id: messages.length + 1,
            text: inputText,
            sender: "user",
            timestamp: new Date().getTime(),
          };
          // add the bot input to the message array
          const newBotMessage: Message = {
            id: messages.length + 2,
            text: botResponse,
            sender: "bot",
            timestamp: new Date().getTime(),
          };
          setMessages([...messages, newUserMessage, newBotMessage]);
          setInputText("");
        } else {
          console.error("Response structure error");
        }
      } else {
        console.error("Google Cloud API Error");
      }
    } catch (error) {
      console.error("Line 76 Error:", error);
    }
    setLoading(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Scrape Talk</h1>

      <div className="space-y-4">
        {messages.map((item) => (
          <div
            key={item.id}
            className={`flex ${
              item.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg ${
                item.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              <p>{item.text}</p>
              <p className="text-xs mt-2">
                {new Date(item.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex mt-4">
        <input
          placeholder="Let's talk Boi..."
          value={inputText}
          onChange={handleInputChange}
          className="flex-1 p-2 border rounded-lg text-black text-2xl "
        />

        <button
          onClick={generateText}
          className="ml-2 p-2 bg-blue-500   text-white rounded-lg   "
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
