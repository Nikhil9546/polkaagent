import json
import logging
from typing import AsyncGenerator
from openai import AsyncOpenAI
from ..config import get_settings
from .prompts import SYSTEM_PROMPT, TOOLS

logger = logging.getLogger(__name__)


class DeepSeekEngine:
    def __init__(self):
        settings = get_settings()
        self.client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )
        self.model = settings.deepseek_model

    async def parse_intent(
        self, message: str, wallet_address: str, context: list[dict] | None = None
    ) -> dict:
        """Parse user intent and return structured action plan."""
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if context:
            messages.extend(context)

        messages.append(
            {
                "role": "user",
                "content": f"[Wallet: {wallet_address}]\n{message}",
            }
        )

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.1,
            max_tokens=1024,
        )

        choice = response.choices[0]
        result = {
            "message": "",
            "actions": [],
            "tool_calls": [],
        }

        if choice.message.content:
            result["message"] = choice.message.content

        if choice.message.tool_calls:
            for tool_call in choice.message.tool_calls:
                action = {
                    "action": tool_call.function.name,
                    "params": json.loads(tool_call.function.arguments),
                    "tool_call_id": tool_call.id,
                }
                result["actions"].append(action)

        return result

    async def stream_intent(
        self, message: str, wallet_address: str, context: list[dict] | None = None
    ) -> AsyncGenerator[str, None]:
        """Stream AI response for real-time chat experience."""
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if context:
            messages.extend(context)

        messages.append(
            {
                "role": "user",
                "content": f"[Wallet: {wallet_address}]\n{message}",
            }
        )

        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.1,
            max_tokens=1024,
            stream=True,
        )

        tool_calls_buffer = {}
        current_content = ""

        async for chunk in stream:
            delta = chunk.choices[0].delta

            if delta.content:
                current_content += delta.content
                yield json.dumps({"type": "content", "data": delta.content})

            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in tool_calls_buffer:
                        tool_calls_buffer[idx] = {
                            "id": tc.id or "",
                            "name": tc.function.name if tc.function and tc.function.name else "",
                            "arguments": "",
                        }
                    if tc.id:
                        tool_calls_buffer[idx]["id"] = tc.id
                    if tc.function:
                        if tc.function.name:
                            tool_calls_buffer[idx]["name"] = tc.function.name
                        if tc.function.arguments:
                            tool_calls_buffer[idx]["arguments"] += tc.function.arguments

            if chunk.choices[0].finish_reason == "tool_calls":
                for idx in sorted(tool_calls_buffer.keys()):
                    tc = tool_calls_buffer[idx]
                    try:
                        params = json.loads(tc["arguments"])
                    except json.JSONDecodeError:
                        params = {}
                    yield json.dumps(
                        {
                            "type": "action",
                            "data": {
                                "action": tc["name"],
                                "params": params,
                                "tool_call_id": tc["id"],
                            },
                        }
                    )

            if chunk.choices[0].finish_reason:
                yield json.dumps({"type": "done", "data": chunk.choices[0].finish_reason})

    async def generate_response_with_results(
        self,
        original_message: str,
        wallet_address: str,
        tool_results: list[dict],
        context: list[dict] | None = None,
    ) -> str:
        """Generate a follow-up response after tool execution with results."""
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if context:
            messages.extend(context)

        messages.append(
            {
                "role": "user",
                "content": f"[Wallet: {wallet_address}]\n{original_message}",
            }
        )

        # Add assistant message with tool calls
        assistant_tool_calls = []
        for tr in tool_results:
            assistant_tool_calls.append(
                {
                    "id": tr["tool_call_id"],
                    "type": "function",
                    "function": {
                        "name": tr["action"],
                        "arguments": json.dumps(tr.get("params", {})),
                    },
                }
            )

        messages.append(
            {"role": "assistant", "tool_calls": assistant_tool_calls}
        )

        # Add tool results
        for tr in tool_results:
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tr["tool_call_id"],
                    "content": json.dumps(tr["result"]),
                }
            )

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.3,
            max_tokens=512,
        )

        return response.choices[0].message.content or ""
