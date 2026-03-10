import asyncio
from functools import partial

from openai import OpenAI

from app.config import settings

# NVIDIA NIM uses the sync OpenAI client (AsyncOpenAI streaming is not supported)
_client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=settings.OPENAI_API_KEY,
)


def _call_nvidia(prompt: str) -> str:
    """Synchronous NVIDIA NIM call — run in a thread via asyncio.to_thread."""
    completion = _client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": prompt}],
        temperature=1,
        top_p=1,
        max_tokens=512,
        stream=True,
    )
    result = ""
    for chunk in completion:
        if not getattr(chunk, "choices", None):
            continue
        delta = chunk.choices[0].delta.content
        if delta is not None:
            result += delta
    return result.strip()


async def generate_birthday_poem(username: str, birthday_info: str | None) -> str:
    """Call NVIDIA NIM to pre-generate a birthday poem (in Vietnamese) for a Normal User."""
    context = birthday_info or "ngày đặc biệt của họ"
    prompt = (
        f"Hãy viết một bài thơ sinh nhật ấm áp, chân thành bằng tiếng Việt "
        f"dành cho người có tên {username}. "
        f"Đề cập đến: {context}. "
        "Bài thơ nên có 4–6 dòng, vui tươi và mang đậm tình cảm cá nhân. "
        "Chỉ trả về bài thơ, không có lời giải thích thêm."
    )
    # Run the blocking sync call in a thread pool so we don't block the event loop
    return await asyncio.to_thread(_call_nvidia, prompt)

