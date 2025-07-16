import { useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";

export default function CallPage() {
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";
  const result: any = fetcher.data;

  const [summaries, setSummaries] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/updates");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setSummaries((prev) => [message, ...prev]);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    return () => {
      ws.close();
    };
  }, []);

  const callDetails = result?.vapi_response && {
    callId: result.vapi_response.id,
    number: result.vapi_response.customer?.number,
    createdAt: result.vapi_response.createdAt,
    listenUrl: result.vapi_response.monitor?.listenUrl,
  };

  return (
    <div className="min-h-screen bg-vapi-background text-vapi-text p-6 flex justify-center items-center">
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl justify-between">
        {/* Form Section */}
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
                "e.g. Ask if Het left his jacket at the hotel on Friday",
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
              {callDetails.listenUrl && (
                <a
                  href={callDetails.listenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-vapi-green underline text-sm"
                >
                  🔊 Listen to Live Call
                </a>
              )}
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

        {/* Sidebar Section */}
        <div className="w-full lg:w-96 bg-vapi-surface p-4 rounded border border-vapi-border text-white overflow-y-auto max-h-[80vh]">
          <h2 className="text-lg font-semibold mb-3 text-center">
            📞 Call Summaries
          </h2>
          {summaries.length === 0 && (
            <p className="text-sm text-gray-400 text-center">
              No summaries yet
            </p>
          )}
          {summaries.map((summary, index) => (
            <div key={index} className="mb-4 border-b border-vapi-border pb-2">
              <p className="text-xs text-vapi-green">
                Call ID: {summary.call_id}
              </p>
              <p className="text-sm mt-1 font-semibold">Summary:</p>
              <pre className="text-sm whitespace-pre-wrap mt-1 text-vapi-text">
                {summary.summary || "No summary provided"}
              </pre>
              {summary.structured_data && (
                <details className="text-xs mt-1 text-gray-300">
                  <summary className="cursor-pointer">Structured Data</summary>
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(summary.structured_data, null, 2)}
                  </pre>
                </details>
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
