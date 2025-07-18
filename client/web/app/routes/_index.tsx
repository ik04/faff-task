import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { LoaderData } from "~/types/types";
import { log } from "node:console";

export const loader = async () => {
  const wsUrl: string = process.env.WEBSOCKET_URL || "";
  return { wsUrl };
};

export default function CallPage() {
  const { wsUrl } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";
  const result: any = fetcher.data;

  const [logs, setLogs] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fetcher.state === "submitting") {
      setLogs([]);
    }
  }, [fetcher.state]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!wsUrl) {
      console.warn("WebSocket URL not provided");
      return;
    }

    const ws = new WebSocket(`${wsUrl}/updates`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const log = data?.message;
      if (!log?.type) {
        console.warn("Missing log type:", log);
        return;
      }
      setLogs((prev) => {
        const updated = [
          {
            ...log,
            receivedAt: new Date().toISOString(),
          },
          ...prev,
        ];
        setTimeout(() => {
          if (logContainerRef.current) {
            if (log.type === "end-of-call-report") {
              logContainerRef.current.scrollTop = 0; // Scroll to top
            } else {
              logContainerRef.current.scrollTop =
                logContainerRef.current.scrollHeight; // Auto-scroll to bottom
            }
          }
        }, 0);

        return updated;
      });

      switch (log.type) {
        case "status-update":
          console.log("Status:", log.status);
          break;
        case "end-of-call-report":
          console.log("Summary:", log.summary);
          console.log("Transcript:", log.transcript);
          console.log("Recording:", log.recordingUrl);
          break;
        case "hang":
          console.log("Call was hung up or had no response.");
          break;
        case "function-call":
          console.log("Function Call:", log.name, log.parameters);
          break;
        case "speech-update":
          console.log("Live Speech Snippet:", log.transcript);
          break;
        case "transcript":
          console.log("Final Transcript:", log.transcript);
          break;
        case "voice-input":
          console.log("Customer is speaking...");
          break;
        default:
          console.log("Other type:", log.type, log);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    return () => {
      ws.close();
    };
  }, [wsUrl]);

  const callDetails = result?.vapi_response && {
    callId: result.vapi_response.id,
    number: result.vapi_response.customer?.number,
    createdAt: result.vapi_response.createdAt,
  };

  return (
    <div className="min-h-screen bg-vapi-background text-vapi-text p-6 flex justify-center items-center">
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl justify-between">
        <div className="w-full max-w-xl space-y-6 flex-1">
          <h1 className="text-3xl font-bold text-vapi-green text-center">
            Nova Voice Agent
          </h1>

          <fetcher.Form method="post" className="space-y-4">
            {[
              ["Phone Number", "phone_number", "tel", "+91xxxxxxxxxx"],
              [
                "Raw Intent",
                "raw_intent",
                "textarea",
                "e.g. Ask if there's any reservations for a table at 7 PM",
              ],
              ["User Name", "user_name", "text"],
              ["Location", "location", "text"],
              ["Time", "time", "text"],
            ].map(([label, name, type, placeholder]) => (
              <div key={name}>
                <label className="block font-semibold mb-1">{label}</label>
                {type === "textarea" ? (
                  <textarea
                    name={name}
                    required
                    className="w-full bg-vapi-surface border border-vapi-border rounded p-2 text-white"
                    placeholder={placeholder}
                  />
                ) : (
                  <input
                    name={name}
                    type={type}
                    required={name === "phone_number" || name === "raw_intent"}
                    className="w-full bg-vapi-surface border border-vapi-border rounded p-2 text-white"
                    placeholder={placeholder}
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-vapi-green hover:bg-white hover:text-black duration-150 transition text-white font-semibold py-2 px-4 rounded"
            >
              {isLoading ? "Placing Call..." : "Place Call"}
            </button>
          </fetcher.Form>

          {callDetails && (
            <div className="p-4 border border-vapi-border rounded bg-vapi-greenBg text-vapi-green">
              <h2 className="font-semibold mb-2">✅ Call Initiated</h2>
              <p className="text-sm">Call ID: {callDetails.callId}</p>
              <p className="text-sm">To: {callDetails.number}</p>
              <p className="text-sm">
                Started At: {new Date(callDetails.createdAt).toLocaleString()}
              </p>
            </div>
          )}

          {result?.error && (
            <div className="p-4 border border-vapi-border rounded bg-vapi-redBg text-vapi-red">
              <h2 className="font-semibold">❌ Error</h2>
              <p className="text-sm mt-2 whitespace-pre-wrap">
                {JSON.stringify(result.error, null, 2)}
              </p>
            </div>
          )}
        </div>

        <div
          ref={logContainerRef}
          className="w-full lg:w-96 bg-vapi-surface p-4 rounded border border-vapi-border text-white overflow-y-auto max-h-[80vh]"
        >
          <h2 className="text-lg font-semibold mb-3 text-center">
            📗 Call Logs
          </h2>

          {logs.length === 0 && (
            <p className="text-sm text-gray-400 text-center">
              No logs received yet
            </p>
          )}

          {logs.map((log, index) => (
            <div key={index} className="mb-4 border-b border-vapi-border pb-2">
              <p className="text-xs text-vapi-green font-mono break-all">
                Call ID: {log.call?.id || log.callId || "Unknown"}
              </p>
              <p className="text-xs text-gray-400">
                Event: {log.type || "message"} @{" "}
                {new Date(log.timestamp || log.receivedAt).toLocaleString()}
              </p>

              {log.type === "status-update" && log.status && (
                <p className="text-sm mt-1 text-yellow-400">
                  Status: {log.status}
                </p>
              )}

              {log.type === "end-of-call-report" && (
                <>
                  <p className="text-sm mt-2 text-vapi-green font-semibold pb-1 text-start">
                    Summary:
                  </p>
                  <pre className="whitespace-pre-wrap text-sm text-gray-400">
                    {log.summary}
                  </pre>

                  {log.transcript && (
                    <>
                      <p className="text-sm mt-2 text-vapi-green font-semibold pb-1 text-start">
                        Transcript:
                      </p>
                      <pre className="whitespace-pre-wrap text-sm text-gray-400">
                        {log.transcript}
                      </pre>
                    </>
                  )}

                  {log.recordingUrl && (
                    <p className="text-sm mt-2">
                      🎧 Recording:{" "}
                      <a
                        href={log.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-vapi-green underline"
                      >
                        Listen
                      </a>
                    </p>
                  )}
                </>
              )}

              {log.type === "speech-update" && log.transcript && (
                <p className="text-sm italic text-vapi-text mt-2">
                  🗣️ {log.transcript}
                </p>
              )}

              {log.type === "transcript" && (
                <>
                  <p className="text-sm mt-2 font-semibold text-vapi-green">
                    Transcript:
                  </p>
                  <pre className="whitespace-pre-wrap text-sm text-vapi-text">
                    {log.transcript}
                  </pre>
                </>
              )}

              {log.type === "function-call" && (
                <>
                  <p className="text-sm mt-2 font-semibold text-vapi-green">
                    🔧 Tool Called
                  </p>
                  <p className="text-sm text-vapi-text">Tool: {log.name}</p>
                  <pre className="text-xs whitespace-pre-wrap text-gray-300">
                    {JSON.stringify(log.parameters, null, 2)}
                  </pre>
                </>
              )}

              {log.type === "hang" && (
                <p className="text-sm mt-2 italic text-gray-400">
                  📞 Call hung up or no response.
                </p>
              )}

              {log.type === "voice-input" && (
                <p className="text-sm mt-2 italic text-gray-400">
                  🧏 Customer is speaking...
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const payload = Object.fromEntries(formData);

  try {
    const response = await fetch(`${process.env.SERVER_URL}/vapi/call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return json({ error: result }, { status: response.status });
    }

    return json(result);
  } catch (err: any) {
    return json(
      { error: err.message || "Unexpected error occurred." },
      { status: 500 }
    );
  }
}
