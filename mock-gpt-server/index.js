const express = require("express");
const cors = require("cors");
const { Readable } = require("stream");

const app = express();
app.use(cors());
app.use(express.json());

function createReadableStream(responses) {
  const stream = new Readable({
    read() {},
  });

  responses.forEach((response) => {
    stream.push(`data: ${JSON.stringify(response)}\n\n`);
  });

  stream.push("data: [DONE]\n\n");
  stream.push(null);
  return stream;
}

function createDeltaResponse({ content = null, role = null, id = null }) {
  const delta = {};
  if (content !== null) delta.content = content;
  if (role !== null) delta.role = role;

  return {
    id: id || "chatcmpl-" + Date.now(),
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "mock-model",
    choices: [
      {
        index: 0,
        delta: delta,
        finish_reason: null,
      },
    ],
  };
}

function createFinalDeltaResponse(id) {
  return {
    id,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "mock-model",
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: "stop",
      },
    ],
  };
}

app.post("/chat/completions", async (req, res) => {
  try {
    const { messages, stream = false } = req.body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: {
          message: "Messages array is required",
          type: "invalid_request_error",
        },
      });
    }

    const lastMessage = messages[messages.length - 1];
    const mockResponse = `This is a mock response to: ${lastMessage.content}`;
    const responseId = "chatcmpl-" + Date.now();

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Method 1: Using Readable Stream
      if (process.env.USE_READABLE_STREAM) {
        const responses = [];

        responses.push(
          createDeltaResponse({
            role: "assistant",
            id: responseId,
          })
        );

        const words = mockResponse.split(" ");
        words.forEach((word) => {
          responses.push(
            createDeltaResponse({
              content: word + " ",
              id: responseId,
            })
          );
        });

        responses.push(createFinalDeltaResponse(responseId));

        const stream = createReadableStream(responses);
        stream.pipe(res);

        return;
      }

      // Method 2: Direct writing (current implementation)

      res.write(
        `data: ${JSON.stringify(
          createDeltaResponse({
            role: "assistant",
            id: responseId,
          })
        )}\n\n`
      );

      const words = mockResponse.split(" ");
      for (const word of words) {
        const chunk = `data: ${JSON.stringify(
          createDeltaResponse({
            content: word + " ",
            id: responseId,
          })
        )}\n\n`;
        res.write(chunk);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      res.write(
        `data: ${JSON.stringify(createFinalDeltaResponse(responseId))}\n\n`
      );
      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      res.json({
        id: responseId,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "mock-model",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: mockResponse,
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: {
        message: "Internal server error",
        type: "server_error",
      },
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: "Internal server error",
      type: "server_error",
    },
  });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
