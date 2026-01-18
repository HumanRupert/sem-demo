import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";

// Configure the ADK agent connection
const adkAgent = new HttpAgent({
  url: "http://localhost:8000/",
});

// Create the CopilotKit runtime with the ADK agent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runtime = new CopilotRuntime({
  agents: {
    shopping_assistant: adkAgent as any,
  },
});

// Use empty adapter since we're using a single external agent
const serviceAdapter = new ExperimentalEmptyAdapter();

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
