import { useState } from "react";
import { Form, useFetcher } from "@remix-run/react";

export default function CallPage() {
  const fetcher = useFetcher();
  const [submitted, setSubmitted] = useState(false);

  const isLoading = fetcher.state !== "idle";
  const result = fetcher.data as any;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        📞 Initiate Voice Call with Nova
      </h1>

      <fetcher.Form method="post" className="space-y-4">
        <div>
          <label className="block font-medium">Phone Number</label>
          <input
            name="phone_number"
            type="tel"
            required
            className="w-full border rounded p-2"
            placeholder="+91xxxxxxxxxx"
          />
        </div>

        <div>
          <label className="block font-medium">Raw Intent</label>
          <textarea
            name="raw_intent"
            required
            className="w-full border rounded p-2"
            placeholder="e.g. Ask if Het left his jacket at the hotel on Friday"
          />
        </div>

        <div>
          <label className="block font-medium">User Name</label>
          <input
            name="user_name"
            type="text"
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block font-medium">Location</label>
          <input
            name="location"
            type="text"
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block font-medium">Time</label>
          <input
            name="time"
            type="text"
            className="w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isLoading ? "Placing Call..." : "Place Call"}
        </button>
      </fetcher.Form>

      {result && (
        <div className="p-4 border rounded bg-green-50">
          <h2 className="font-semibold text-green-700">✅ Call Status</h2>
          <pre className="text-sm mt-2 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const payload = Object.fromEntries(formData);

  const response = await fetch(`${process.env.SERVER_URL}/vapi/call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return result;
}
