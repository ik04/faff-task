import { useFetcher } from "@remix-run/react";

export default function CallPage() {
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";
  const result: any = fetcher.data;

  return (
    <div className="min-h-screen bg-vapi-background text-vapi-text p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-3xl font-bold text-vapi-green">Nova Voice Agent</h1>

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

        {result && !result.error && (
          <div className="p-4 border border-vapi-border rounded bg-vapi-greenBg text-vapi-green">
            <h2 className="font-semibold">✅ Call Status</h2>
            <pre className="text-sm mt-2 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
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
    </div>
  );
}

import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";

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
